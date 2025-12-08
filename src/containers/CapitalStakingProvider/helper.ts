export const constructTransactionUrl = (url: string, hash: string) => {
  return `${url}/tx/${hash}`;
};
