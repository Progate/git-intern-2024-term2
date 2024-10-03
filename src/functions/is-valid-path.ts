// パス名がgitの定める条件に従っているかをチェック
// https://github.com/git/git/blob/v2.12.0/Documentation/technical/index-format.txt
export const isValidPath = (filePath: string): boolean => {
  // トップレベルディレクトリからの相対パスであることを確認（先頭のスラッシュがないこと）
  if (filePath.startsWith("/")) {
    return false;
  }

  // 末尾のスラッシュを禁止
  if (filePath.endsWith("/")) {
    return false;
  }

  // パスコンポーネントをチェック
  const components = filePath.split("/");
  for (const component of components) {
    if (component === "." || component === ".." || component === ".git") {
      return false;
    }
  }

  return true;
};
