
declare module "when" {

  function defer(): Deferred;
  function map(list, action);
  function all(list);
  function resolve(any?);

  export interface Deferred {
    promise: Promise;
    resolve(...args:any[]);
  }

  export interface Promise {
    then(...args:any[]):Promise;
    map(...args:any[]):Promise;
  }
}