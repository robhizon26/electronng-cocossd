
export const GetVideoStatus = (videoStatus, type) => {
  if (videoStatus === 'isPaused') return `${type} is paused.`;
  if (videoStatus === 'isPlaying') return `${type} is playing.`;
  if (videoStatus === 'isReady') return `${type} is ready.`;
  if (videoStatus === 'webcamError') return `${type} error.`;
  if (videoStatus === 'screencapError') return `${type} error.`;
  if (videoStatus === 'hasEnded') return `${type} has ended.`;
  return `${type} is not ready.`;
}

export const ElectronLogic = (<any>window).require

//args = canvasElement, predictions, pixelsShape
export const DrawPredictions = (...args) => {
  const ctx = args[0].getContext('2d');
  ctx.canvas.width = 1366;
  ctx.canvas.height = 768;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  // Font options.
  const font = "18px sans-serif";
  ctx.font = font;
  ctx.textBaseline = "top";
  const textHeight = parseInt(font, 10); // base 10

  const xfact = ctx.canvas.width / args[2][1];
  const yfact = ctx.canvas.height / args[2][0];
  ProcessPredictions2(args[1], ctx, xfact, yfact, textHeight)
};

//args = predictions, ctx , xfact, yfact, textHeight
export const ProcessPredictions2 = (...args) => {
  args[0].forEach(item => {
    const x = item['bbox'][0] * args[2];
    const y = item['bbox'][1] * args[3];
    const width = item['bbox'][2] * args[2];
    const height = item['bbox'][3] * args[3];

    // Draw the class label background.
    args[1].fillStyle = "#00FFFF";
    const text = item["class"] + " " + (100 * item["score"]).toFixed(2) + "%";
    const textWidth = args[1].measureText(text).width;
    //check if label position is off screen
    const labelXposition = x < 0 ? x + width - textWidth : x;
    const labelYposition = (y - args[4] < 0 ? y + height : y) - args[4];
    args[1].fillRect(labelXposition, labelYposition, textWidth, args[4]);

    // Draw the bounding box.
    args[1].strokeStyle = "#00FFFF";
    args[1].lineWidth = 2;
    args[1].strokeRect(x, y, width, height);
  });
  args[0].forEach(item => {
    const x = item['bbox'][0] * args[2];
    const y = item['bbox'][1] * args[3];
    const width = item['bbox'][2] * args[2];
    const height = item['bbox'][3] * args[3];

    const text = item["class"] + " " + (100 * item["score"]).toFixed(2) + "%";
    const textWidth = args[1].measureText(text).width;
    //check if label position is off screen
    const labelXposition = x < 0 ? x + width - textWidth : x;
    const labelYposition = (y - args[4] < 0 ? y + height : y) - args[4];

    // Draw the text last to ensure it's on top.
    args[1].fillStyle = "#000000";
    args[1].fillText(text, labelXposition, labelYposition);
  });
}

export const AdjustHeight = (divElement, videoElement, canvasElement) => {
  divElement.setAttribute('style', 'height:' + (videoElement.offsetHeight).toString() + 'px');
  canvasElement.setAttribute('style', 'height:' + (videoElement.offsetHeight - 4).toString() + 'px');
}

export const CreatePluralMapKVP = (text) => {
  let apluralmap = text.split('\n')
  apluralmap = apluralmap.filter(item => item.trim().length > 0 && item.indexOf(',') > -1)
  let pluralmap: { [Id: string]: string } = {};
  apluralmap.forEach(sp => {
    let kvitem = sp.split(',')
    pluralmap[kvitem[0].trim()] = kvitem[1].trim()
  })
  return pluralmap;
}
