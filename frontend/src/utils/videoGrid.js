// let customRatio = true;
let ratios = ['4:3', '16:9', '1:1', '1:2'];
let aspect = 0;
const margin = 0;
let ratio = getAspectRatio();

function getAspectRatio() {
  let ratio = ratios[aspect].split(':');
  return ratio[1] / ratio[0];
}

const calcArea = (increment, videos, width, height) => {
  let i = 0;
  let w = 0;
  let h = increment * ratio + (margin * 2);
  while (i < (videos.length)) {
      if ((w + increment) > width) {
          w = 0;
          h = h + (increment * ratio) + (margin * 2);
      }
      w = w + increment + (margin * 2);
      i++;
  }
  if (h > height || increment > width) return false;
  else return increment;
}

const setWidth = (videos, width) => {
  for (let s = 0; s < videos.length; s++) {
    let element = videos[s];

    element.style.margin = margin + "px";
    element.style.width = width + "px";
    element.style.height = (width * ratio) + "px";

    element.setAttribute('data-aspect', ratios[aspect]);
  }
}

const resizeVideos = () => {
  const videoMediaContainer = document.getElementById("videos");
  let width = videoMediaContainer.offsetWidth - (margin * 2);
	let height = videoMediaContainer.offsetHeight - (margin * 2);
  const videos = document.querySelectorAll("#videos .video"); 

  let max = 0
  let i = 1
  while (i < 5000) {
    let area = calcArea(i, videos, width, height);
    if (area === false) {
      max = i - 1;
      break;
    }
    i++;
  }

  max = max - (margin * 2);
  setWidth(videos, max);

  window.addEventListener("resize", function () {
    resizeVideos();
  });
}

export {
  resizeVideos
}