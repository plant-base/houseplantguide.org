#!/usr/bin/env rust-script
//! ```cargo
//! [dependencies]
//! reqwest = { version = "0.11", features = ["json"] }
//! serde = { version = "1", features = ["derive"] }
//! tokio = { version = "1", features = ["full"] }
//! serde_json = "1"
//! form_urlencoded = "1.2.1"
//! anyhow = "1.0.77"
//! ```

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tokio;
use anyhow::Result;
use std::{fs::File, io::{copy, Cursor}};
use std::fs::OpenOptions;
use std::io::Write;
use std::fs;

#[derive(Debug, Serialize, Deserialize)]
struct MetadataEntry {
    title: String
}

#[derive(Debug, Deserialize)]
struct WikipediaImageResponse {
    query: ImageQuery,
}

#[derive(Debug, Deserialize)]
struct WikipediaAttributionResponse {
    query: AttributionQuery,
}

#[derive(Debug, Deserialize)]
struct ImageQuery {
    pages: std::collections::HashMap<String, ImagePage>,
}

#[derive(Debug, Deserialize)]
struct AttributionQuery {
    pages: std::collections::HashMap<String, AttributionPage>,
}


#[derive(Debug, Deserialize)]
struct ImagePage {
    original: Option<Original>,
}

#[derive(Debug, Deserialize)]
struct Original {
    source: String,
}

#[derive(Debug, Deserialize)]
struct AttributionPage {
    imageinfo: Vec<ImageInfo>,
}

#[derive(Debug, Deserialize)]
struct ImageInfo {
    extmetadata: Option<ExtMetaData>,
}

#[derive(Debug, Deserialize)]
struct ExtMetaData {
    AttributionRequired: AttributionRequired,
    Artist: Option<Artist>,
    ObjectName: ObjectName,
    LicenseShortName: LicenseShortName,
}

#[derive(Debug, Deserialize)]
struct AttributionRequired {
    value: String,
}

#[derive(Debug, Deserialize)]
struct Artist {
    value: String,
}

#[derive(Debug, Deserialize)]
struct ObjectName {
    value: String,
}

#[derive(Debug, Deserialize)]
struct LicenseShortName {
    value: String,
}


fn file_exists(path: &PathBuf) -> bool {
    path.exists()
}

async fn fetch_image_attribution(image_name: &str) -> Result<Option<String>> {
    let mut title: String = "File:".to_owned();
    title.push_str(image_name);

    let base_url = "https://en.wikipedia.org/w/api.php";
    let params = [
        ("action", "query"),
        ("prop", "imageinfo"),
        ("iiprop", "extmetadata"),
        ("titles", &title),
        ("format", "json"),
    ];


    let client = reqwest::Client::new();
    // println!("Fetching image attribution for {}.", title);

    let resp = client
        .get(base_url)
        .header(reqwest::header::USER_AGENT, "Plantbase/1.0 bot")
        .query(&params)
        .send()
        .await?;

    // println!("{}", resp.url());

    if resp.status().is_success() {
        let body = resp.json::<WikipediaAttributionResponse>().await?;
        if let Some(page) = body.query.pages.values().next() {
            let imageinfo = &page.imageinfo[0];
            if let Some(extmetadata) = &imageinfo.extmetadata {
                let mut attribution = "".to_owned();

                let required = extmetadata.AttributionRequired.value.clone();
                if required == "true" {
                    let artist = match &extmetadata.Artist {
                        None => String::from("anonymous"),
                        Some(a) => a.value.clone(),
                    };
                    let license = extmetadata.LicenseShortName.value.clone();
                    let name = extmetadata.ObjectName.value.clone();

                    attribution.push_str(&artist);
                    attribution.push_str(", ");
                    attribution.push_str(&name);
                    attribution.push_str(", ");
                    attribution.push_str(&license);
                }
                return Ok(Some(attribution));
            } else { println!("FAIL extmetadata") }
        } else { println!("FAIL page") }
    }

    Ok(Some(String::from("missing")))
}

async fn fetch_image_url(scientific_name: &str, fetch_attribution: bool) -> Result<(Option<String>, Option<String>)> {
    let url = "https://en.wikipedia.org/w/api.php";
    let params = [
        ("action", "query"),
        ("prop", "pageimages"),
        ("format", "json"),
        ("piprop", "original"),
        ("titles", scientific_name),
        ("pithumbsize", "100"),
    ];

    let client = reqwest::Client::new();
    //let request_url = format!("{}?{}", url, form_urlencoded::Serializer::new(String::new()).extend_pairs(&params).finish());
   // println!("Fetching image.");

    let resp = client
        .get(url)
        .header(reqwest::header::USER_AGENT, "Plantbase/1.0 bot")
        .query(&params)
        .send()
        .await?;

    if resp.status().is_success() {
        let body = resp.json::<WikipediaImageResponse>().await?;
        if let Some(page) = body.query.pages.values().next() {
            if let Some(original) = &page.original {
                let source = original.source.clone();

                let mut attr = String::from("");

                if let Some(last_slash) = source.rfind('/') {
                    if fetch_attribution {
                        let filename = &source[(last_slash + 1)..];
                        let cleaned_filename = filename.replace("%E2%80%98", "‘");
                        let cleaned_filename2 = cleaned_filename.replace("%2C", ",");
                        let cleaned_filename3 = cleaned_filename2.replace("%E2%80%99", "’");
                        let cleaned_filename4 = cleaned_filename3.replace("%28", "(");
                        let cleaned_filename5 = cleaned_filename4.replace("%29", ")");
                        let cleaned_filename6 = cleaned_filename5.replace("%27", "'");
                        let cleaned_filename7 = cleaned_filename6.replace("%C3%BC", "ü");
                        let cleaned_filename8 = cleaned_filename7.replace("%CB%90", "ː");

                        println!("📄 {}", cleaned_filename8);

                        let attribution = fetch_image_attribution(&cleaned_filename8).await?;

                        if let Some(ref a) = attribution {
                            attr = a.to_string();
                        }
                    } else {
                        return Ok((Some(source), Some(String::from("missing"))));
                    }
                } else {
                    println!("ERROR: No filename found in the URL");
                }


                return Ok((Some(source), Some(attr)));
            }
        }
    }

    Ok((None, Some(String::from("missing"))))
}

async fn handle_image_download_or_placeholder(
    url: Option<String>,
    directory: &PathBuf,
    filename: &str,
) -> Result<()> {
    if let Some(url) = url {
        let image_path = directory.join(filename);

        if !file_exists(&image_path) {

            download_image(&url, directory, filename).await?;
        } else {
            println!("✅  Skip download")
        }
    } else {
        // Use placeholder image if no URL is available
        let placeholder_url = "https://placehold.co/1000x1000/png?text=Missing";

        let image_path = directory.join(filename);

        if !file_exists(&image_path) {

            download_image(placeholder_url, directory, filename).await?;
        } else {
            println!("✅  Skip download");
        }
    }

    Ok(())
}

// async fn handle_attribution(
//     attribution: String,
//     directory: &PathBuf,
//     filename: &str,
// ) -> Result<()> {
//     println!("©️ {}",attribution);
//     let markdown_path = directory.join(filename);
//     if !file_exists(&markdown_path) {
//         println!("MARKDOWN DOES NOT EXIST YET, THIS IS WEIRD");
//     } else {
//         // Read the content of the file.
//         let file_content = fs::read_to_string(&markdown_path)?;

//         // Split the content into lines.
//         let mut lines: Vec<&str> = file_content.lines().collect();

//         // Check if the second line contains "attribution"
//         if lines[1].contains("attribution") {
//             // Remove the second line
//             lines.remove(1);
//         }

//         // Create the attribution line
//         let attribution_line = format!("attribution: {}", attribution);

//         // Add the new line at the second position
//         lines.insert(1, &attribution_line);

//         // Join the modified lines back into a string
//         let modified_content = lines.join("\n");

//         // Write the modified content back to the file
//         fs::write(markdown_path, modified_content)?;
//     }
//     Ok(())
// }

async fn download_image(url: &str, directory: &PathBuf, filename: &str) -> Result<()> {
    println!("🔄 {}", &url);
    let client = reqwest::Client::new();

    // Send an HTTP GET request to the URL.
    let response = client
        .get(url)
        .header(reqwest::header::USER_AGENT, "Plantbase/1.0 bot")
        .send()
        .await?;

    return match response.status() {
        reqwest::StatusCode::OK => {
            let mut dest = directory.clone();
            dest.push(filename);

            // Create a new file to write the downloaded image to.
            let mut file = File::create(&dest)?;

            // Create a cursor that wraps the response body
            let mut content = Cursor::new(response.bytes().await?);

            // Copy the content from the cursor to the file
            copy(&mut content, &mut file)?;

            println!("Image downloaded successfully.");
            Ok(())
        }
        status_code => {
            println!("{}", response.text().await?);
            eprintln!("Failed to download image. Status code: {}", status_code);
            Ok(())
        }
    };
}

#[tokio::main]
async fn main() -> Result<()> {
    let species_folder = PathBuf::from("./data/species");
    let species = std::fs::read_dir(&species_folder)?;

    for entry in species.filter_map(Result::ok).filter(|e| e.file_type().map(|ft| ft.is_dir()).unwrap_or(false)) {
        if let Some(name) = entry.file_name().to_str() {
            let scientific_name = name.replace("-", " ");

            println!("=========== PROCESSING SPECIES - {}", scientific_name);


            let folder = species_folder.join(name);

            // Read the content of the file.
            let directory = &folder;
            let filename = &format!("{}.md", name);
            let markdown_path = directory.join(filename);
            let file_content = fs::read_to_string(&markdown_path)?;
            //let mut lines: Vec<&str> = file_content.lines().collect();
            //let fetch_attribution = !lines[1].contains("attribution") || lines[1].chars().count() < 30;

         

            // if let Some(ref a) = attribution {

            //     if a == "" {
            //         handle_attribution("missing".to_string(), &folder, &format!("{}.md", name)).await?;
            //     } else {
            //         handle_attribution(a.to_string(), &folder, &format!("{}.md", name)).await?;
            //     }
            // }


            let image_filename = format!("{}.jpg", name);
            let image_path = folder.join(&image_filename);
            let skip_download = file_exists(&image_path);
            if skip_download {
                println!("✅  Skip download");
            } else {
                let (image_url, attribution) = fetch_image_url(&scientific_name, true).await?;
                if let Some(url) = image_url {
            
                
                    download_image(&url, &folder, &image_filename).await?;
        
                
                if let Some(title) = url.split('/').last() {
                    let image_title = title.replace("%20", " ");
                    let attribution_text = attribution.unwrap_or_else(|| "missing".to_string());

                    update_metadata(&folder, &image_filename, &attribution_text)?;
                }
            } else {
                println!("⚠️ No image found on Wikipedia for {}", scientific_name);
            }
            }

           

           

           // handle_image_download_or_placeholder(image_url, &folder, &format!("{}.jpg", name)).await?;
        }
    }

    let genera_folder = PathBuf::from("./data/genera");
    let genera = std::fs::read_dir(&genera_folder)?;

    for entry in genera.filter_map(Result::ok).filter(|e| e.file_type().map(|ft| ft.is_dir()).unwrap_or(false)) {
        if let Some(name) = entry.file_name().to_str() {
            let scientific_name = name.replace("-", " ");
            println!("=========== GENUS - {}", scientific_name);

            let folder = genera_folder.join(name);

            // Read the content of the file.
            let directory = &folder;
            let filename = &format!("{}.md", name);
            let markdown_path = directory.join(filename);
            let file_content = fs::read_to_string(&markdown_path)?;
           // let mut lines: Vec<&str> = file_content.lines().collect();
            //let fetch_attribution = !lines[1].contains("attribution") || lines[1].chars().count() < 30;

            let (image_url, attribution) = fetch_image_url(&scientific_name, true).await?;


            // if let Some(ref a) = attribution {

            //     if a == "" {
            //         handle_attribution("missing".to_string(), &folder, &format!("{}.md", name)).await?;
            //     } else {
            //         handle_attribution(a.to_string(), &folder, &format!("{}.md", name)).await?;
            //     }
            // }


            let image_filename = format!("{}.jpg", name);

if let Some(url) = image_url {
    let image_path = folder.join(&image_filename);
    if !file_exists(&image_path) {
        download_image(&url, &folder, &image_filename).await?;
    } else {
        println!("✅  Skip download");
    }
    
    if let Some(title) = url.split('/').last() {
        let image_title = title.replace("%20", " ");
        let attribution_text = attribution.unwrap_or_else(|| "missing".to_string());

        update_metadata(&folder, &image_filename, &attribution_text)?;
    }
} else {
    println!("⚠️ No image found on Wikipedia for {}", scientific_name);
}


         //   handle_image_download_or_placeholder(image_url, &folder, &format!("{}.jpg", name)).await?;
        }
    }

    let familiae_folder = PathBuf::from("./data/familiae");
    let familiae = std::fs::read_dir(&familiae_folder)?;

    for entry in familiae.filter_map(Result::ok).filter(|e| e.file_type().map(|ft| ft.is_dir()).unwrap_or(false)) {
        if let Some(name) = entry.file_name().to_str() {
            let scientific_name = name.replace("-", " ");
            println!("=========== FAMILIA - {}", scientific_name);

            let folder = familiae_folder.join(name);

            // Read the content of the file.
            let directory = &folder;
            let filename = &format!("{}.md", name);
            let markdown_path = directory.join(filename);
            let file_content = fs::read_to_string(&markdown_path)?;
       //     let mut lines: Vec<&str> = file_content.lines().collect();
         //   let fetch_attribution = !lines[1].contains("attribution") || lines[1].chars().count() < 30;

            let (image_url, attribution) = fetch_image_url(&scientific_name, true).await?;


            // if let Some(ref a) = attribution {

            //     if a == "" {
            //         handle_attribution("missing".to_string(), &folder, &format!("{}.md", name)).await?;
            //     } else {
            //         handle_attribution(a.to_string(), &folder, &format!("{}.md", name)).await?;
            //     }
            // }

            let image_filename = format!("{}.jpg", name);

            if let Some(url) = image_url {
                let image_path = folder.join(&image_filename);
                if !file_exists(&image_path) {
                    download_image(&url, &folder, &image_filename).await?;
                } else {
                    println!("✅  Skip download");
                }
                
                if let Some(title) = url.split('/').last() {
                    let image_title = title.replace("%20", " ");
                    let attribution_text = attribution.unwrap_or_else(|| "missing".to_string());
            
                    update_metadata(&folder, &image_filename, &attribution_text)?;
                }
            } else {
                println!("⚠️ No image found on Wikipedia for {}", scientific_name);
            }
            
            //handle_image_download_or_placeholder(image_url, &folder, &format!("{}.jpg", name)).await?;
        }
    }
    Ok(())
}

fn update_metadata(directory: &PathBuf, filename: &str, attribution: &str) -> Result<()> {

    let metadata_path = directory.join("metadata.json");

    let mut metadata: HashMap<String, MetadataEntry> = if metadata_path.exists() {
        let content = fs::read_to_string(&metadata_path)?;
        serde_json::from_str(&content)?
    } else {
        HashMap::new()
    };

    // Only insert or update this specific image
    metadata.insert(filename.to_string(), MetadataEntry {
        title: attribution.to_string(),
    });

    let json = serde_json::to_string_pretty(&metadata)?;
    fs::write(metadata_path, json)?;

    Ok(())
}
