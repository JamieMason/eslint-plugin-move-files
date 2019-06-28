const isWalkable = (value: any) =>
  value !== null && typeof value !== 'undefined';

const getChild = (parent: any, child: any): any =>
  isWalkable(parent) ? parent[child] : undefined;

export const getIn = (pathToValue: string, owner?: any, defaultValue?: any) => {
  const deepValue = pathToValue.split('.').reduce(getChild, owner);
  return typeof deepValue !== 'undefined' ? deepValue : defaultValue;
};
