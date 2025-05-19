document.addEventListener('DOMContentLoaded', () => {
    const shareButton = document.getElementById('share-button');
  
    if (navigator.share && shareButton) {
      shareButton.addEventListener('click', async () => {
        try {
          await navigator.share({
            title: document.title,
            text: 'Share this page!',
            url: window.location.href,
          });
          console.log('Page shared!');
        } catch (err) {
          console.error('Error with sharing:', err);
        }
      });
    } else if (shareButton) {
      shareButton.style.display = 'none';
    }
  });
  