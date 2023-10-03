// let customRatio = true;
let ratios = ['4:3', '16:9', '1:1', '1:2'];
let aspect = 0;
let ratio = getAspectRatio();

function getAspectRatio() {
  let ratio = ratios[aspect].split(':');
  return ratio[1] / ratio[0];
}

// function Area(increment, count, width, height, margin = 10) {
//   ratio = customRatio ? 0.75 : ratio;
//     let i = 0;
//     let w = 0;
//     let h = increment * ratio + margin * 2;
//     while (i < count) {
//         if (w + increment > width) {
//             w = 0;
//             h = h + increment * ratio + margin * 2;
//         }
//         w = w + increment + width * 2;
//         i++;
//     }
//     if (h > height) return false;
//     else return increment;
// }

// const setWidth = (videos, width, bigWidth, margin, maxHeight, isOneVideoElement) => {
//   console.log(bigWidth)
//   ratio = customRatio ? 0.68 : ratio;
//   for (let s = 0; s < videos.length; s++) {
//   //   videos[s].style.width = width + 'px';
//   //   videos[s].style.margin = margin + 'px';
//   //   videos[s].style.height = width * ratio + 'px';
//   //   if (isOneVideoElement) {
//   //     videos[s].style.width = bigWidth + 'px';
//   //     videos[s].style.height = bigWidth * ratio + 'px';
//   //     let camHeigh = videos[s].style.height.substring(0, videos[s].style.height.length - 2);
//   //     if (camHeigh >= maxHeight) videos[s].style.height = maxHeight - 2 + 'px';
//   //   }
//   }
// }

// const resizeVideos = () => {
// 	const margin = 5;

// 	const videoMediaContainer = document.getElementById("videos");
// 	let width = videoMediaContainer.offsetWidth - margin * 2;
// 	let height = videoMediaContainer.offsetHeight - margin * 2;
//   const videos = document.querySelectorAll("#videos .video");

//   let max = 0;
//   let isOneVideoElement = videoMediaContainer.childElementCount === 1 ? true : false;

//   let bigWidth = width * 4;
//   if (videoMediaContainer.childElementCount === 1) {
//     width = width - bigWidth;
//   }

//   let i = 1;
//     while (i < 5000) {
//         let w = Area(i, videos.length, width, height, margin);
//         if (w === false) {
//             max = i - 1;
//             break;
//         }
//         i++;
//     }

//     max = max - margin * 2;
//     setWidth(videos, max, bigWidth, margin, height, isOneVideoElement);
//   // document.documentElement.style.setProperty('--vmi-wh', max / 3 + 'px');
// }

const margin = 5;

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
  for (let s = 0; s < this._dish.children.length; s++) {
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
   setWidth(videos, max)
}

export {
  resizeVideos
}