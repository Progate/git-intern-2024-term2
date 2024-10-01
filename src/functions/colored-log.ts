const colors = {
  //https://qiita.com/shuhei/items/a61b4324fd5dbc1af79b
  yellow: "\u001b[33m",
  red: "\u001b[31m",
};

export const coloredLog = ({
  text,
  color,
}: {
  text: string;
  color?: keyof typeof colors;
}): void => {
  const RESET = "\u001b[0m";

  if (color && color in colors) {
    console.log(colors[color] + text + RESET);
    return;
  }

  console.log(text);
};
