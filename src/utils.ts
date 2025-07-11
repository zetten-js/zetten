export const toArray = <T>(data: T | T[] | undefined): T[] => {
  return Array.isArray(data) ?
    data :
    !!data ?
    [data] :
    []
}