export const coloredLog = ({
  text,
  color,
}: {
  text: string;
  color?: "yellow";
}): void => {
  const RESET = "\u001b[0m";
  const colors = {
    //https://qiita.com/shuhei/items/a61b4324fd5dbc1af79b
    yellow: "\u001b[33m",
  };

  if (color && color in colors) {
    console.log(colors[color] + text + RESET);
    return;
  }

  console.log(text);
};
