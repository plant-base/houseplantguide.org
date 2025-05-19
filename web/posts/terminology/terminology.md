--- 
title: Plant Terminology Explained | Glossary of Houseplant Terms
description: "Confused by houseplant terms? Explore our glossary of plant terminology including ph, drainage, nodes, aeration, propagation, and more."
icon: 🔠
date: 2023-12-07
eleventyExcludeFromCollections: false
permalink: "/posts/terminology/"
--- 

# Plant Terminology

When it comes to houseplants, lots of different terms are used in articles, blog posts or websites. Some of these terms are
not clearly/properly explained. This article aims to explain some words you might encounter when it comes to discussing
plants.

### A - D

#### Aerial Roots

{% galleryWithText "aerial-root-1.png" %}
Roots that grow above the soil, common in orchids and monstera.
{% endgalleryWithText %}

#### Aeration

The process of loosening soil to allow air circulation to the roots.

#### Acidity or pH levels

A measure of how acidic or alkaline the soil or water is, on a scale from 0 (very acidic) to 14 (very alkaline), with 7 being neutral.

#### Bottom Watering

{% galleryWithText "bottom-watering-1.png" %}
Watering a plant by placing the pot in a tray of water to absorb moisture from the bottom up.
{% endgalleryWithText %}

#### Capillary Action

How water moves upward through soil or plant tissues, especially in self-watering systems.

#### Cultivar

A plant variety that has been produced in cultivation by selective breeding. Cultivars are usually bred for specific traits like leaf color, size, or disease resistance (e.g., Sansevieria trifasciata ‘Laurentii’).

#### Cutting

A piece of a plant (stem, leaf, or root) used to propagate a new plant.

#### Dormancy

A rest period where growth slows or stops, often in winter.

#### Drainage

The plant’s ability to remove excess water; essential to prevent root rot.

### E - H

#### Epiphyte

A plant that grows on another plant (like orchids), not in soil.

#### Etiolation

Weak, leggy growth caused by insufficient light.

#### Family

A higher taxonomic category that includes one or more genera (plural of genus) with shared traits.

#### Fenestration

{% galleryWithText "fenestration-1.png" %}
Natural holes or splits in leaves, most famously seen in Monstera deliciosa. Often an adaptation for light, water drainage, or wind resistance in a plant’s native environment.
{% endgalleryWithText %}

#### Fertilizer

A substance that provides nutrients to plants.

#### Genus

A group of related plant species that share common characteristics.

#### Guttation

The exudation of water droplets from the edges of leaves, usually at night when soil is moist and humidity is high. It’s harmless but sometimes mistaken for overwatering.

#### Hardiness zone

A geographic area defined by climate, specifically the average minimum winter temperature.

#### Humidity Tray

A shallow tray filled with water and pebbles used to increase humidity around a plant.

### I - O

#### Indirect Light

Light that doesn't hit the plant directly, preferred by many houseplants.

#### Inflorescence

A cluster or group of flowers arranged on a stem.

#### Leggy

Abnormally long, weak stems caused by insufficient light.

#### Light Burn

Damage to leaves due to exposure to intense, direct light.

#### Node

The part of a plant stem where leaves and roots can grow.

#### Overwatering

Excess watering, a common cause of houseplant death.

### P - S

#### Peat Moss

A soil amendment used for water retention, often in potting mixes.

#### Petiole

The stalk that connects a leaf blade to the plant stem.

#### Propagation

{% galleryWithText "propagation-1.png" %}
Plant propagation is the process of producing a new plant from an existing plant.  
Sexual propagation is the process of reproduction of plants by seeds. The resulting plant is a genetic combination of each parent plant.  

Asexual/vegetative propagation is the process of taking a piece of a (usually mature) plant and growing it into a new plant. The resulting plant is genetically identical to the parent plant and essentially a clone.  

Usually when talking about propagation in the context of houseplants, one is referring to the asexual/vegetative variant of propagation and not the sexual variant.
{% endgalleryWithText %}

#### Repotting

Transferring a plant to a larger pot or fresh soil.

#### Rhizome

A thick underground stem that can produce shoots and roots.

#### Root Bound

When a plant’s roots fill up the pot and circle around, limiting growth.

#### Root Rot

Fungal or bacterial decay due to overwatering or poor drainage.

#### Species

The most specific classification of a plant that can reproduce with others of the same kind.

#### Subspecies

A naturally occurring variation within a species, often region-specific, that can still interbreed with the main species.

### T - V

#### Thrips

Tiny insects that feed on plant juices, often causing damage.

#### Transpiration

The process of water evaporation through plant leaves.

#### Turgor pressure

The pressure of water inside plant cells that keeps them firm and upright.

#### Variegation

Leaves with multiple colors or patterns (e.g., white and green).

#### Variety

A naturally occurring plant variation within a species (unlike a cultivar, which is human-made). Denoted by var. in scientific names (e.g., Aloe vera var. chinensis). Not as common in houseplants as cultivars.

### W - Z

#### Wilting

{% galleryWithText "wilting-1.png" %}
Drooping of leaves and stems, often from lack of water or root issues.
{% endgalleryWithText %}

#### Xerophyte

{% galleryWithText "cactus-1.png" %}
A species of plant that has adaptations to survive in dry environments with little liquid water (e.g., cacti).
{% endgalleryWithText %}

#### Yellowing

{% galleryWithText "yellowing-1.png" %}
Leaves turning yellow, often a sign of overwatering, poor drainage, or nutrient deficiency.
{% endgalleryWithText %}



<script>
  const slideIndices = new Map();

  document.querySelectorAll('[data-gallery]').forEach(gallery => {
    slideIndices.set(gallery, 1);
    showSlides(1, gallery);
  });

  function plusSlides(n, el = null) {
    const gallery = el?.closest('[data-gallery]') || document.querySelector('[data-gallery]');
    const current = slideIndices.get(gallery) + n;
    showSlides(current, gallery);
  }

  function showSlides(n, gallery) {
    const slides = gallery.querySelectorAll('.slide');
    if (n > slides.length) n = 1;
    if (n < 1) n = slides.length;
    slideIndices.set(gallery, n);

    slides.forEach(slide => slide.style.display = 'none');
    slides[n - 1].style.display = 'flex';
  }
</script>
