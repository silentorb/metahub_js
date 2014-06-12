
interface Deferred {
  promise: Promise;
  resolve(...args:any[]);
  reject(...args:any[]);
}

interface Promise {
  then(success, error?):Promise;
  map(...args:any[]):Promise;
  done(success?, error?);
  otherwise(error);
}

interface Promise2<T> {
  catch<U>(onRejected?: (reason: any) => Promise2<U>): Promise2<U>;
  catch<U>(onRejected?: (reason: any) => U): Promise2<U>;

  ensure(onFulfilledOrRejected: Function): Promise2<T>;

  inspect(): When.Snapshot<T>;

  otherwise<U>(onRejected?: (reason: any) => Promise2<U>): Promise2<U>;
  otherwise<U>(onRejected?: (reason: any) => U): Promise2<U>;

  then<U>(onFulfilled: (value: T) => Promise2<U>, onRejected?: (reason: any) => Promise2<U>, onProgress?: (update: any) => void): Promise2<U>;
  then<U>(onFulfilled: (value: T) => Promise2<U>, onRejected?: (reason: any) => U, onProgress?: (update: any) => void): Promise2<U>;
  then<U>(onFulfilled: (value: T) => U, onRejected?: (reason: any) => Promise2<U>, onProgress?: (update: any) => void): Promise2<U>;
  then<U>(onFulfilled: (value: T) => U, onRejected?: (reason: any) => U, onProgress?: (update: any) => void): Promise2<U>;
}

//declare module "when" {
//
//}

// Type definitions for When 2.4.0
// Project: https://github.com/cujojs/when
// Definitions by: Derek Cicerone <https://github.com/derekcicerone>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

declare module When {

  function defer(): Deferred;
  function map(list, action);
  function all(list);
  function resolve(...args:any[]);
  function reject(...args:any[]);

  /**
   * Return a promise that will resolve only once all the supplied promisesOrValues
   * have resolved. The resolution value of the returned promise will be an array
   * containing the resolution values of each of the promisesOrValues.
   * @memberOf when
   *
   * @param promisesOrValues array of anything, may contain a mix
   *      of {@link Promise2}s and values
   */
  function all<T>(promisesOrValues: any[]): Promise2<T>;

  /**
   * Creates a {promise, resolver} pair, either or both of which
   * may be given out safely to consumers.
   * The resolver has resolve, reject, and progress.  The promise
   * has then plus extended promise API.
   */
  function defer<T>(): Deferred2<T>;

  /**
   * Joins multiple promises into a single returned promise.
   * @return a promise that will fulfill when *all* the input promises
   * have fulfilled, or will reject when *any one* of the input promises rejects.
   */
  function join<T>(...promises: Promise2<T>[]): Promise2<T[]>;
  /**
   * Joins multiple promises into a single returned promise.
   * @return a promise that will fulfill when *all* the input promises
   * have fulfilled, or will reject when *any one* of the input promises rejects.
   */
  function join<T>(...promises: any[]): Promise2<T[]>;

  /**
   * Returns a resolved promise. The returned promise will be
   *  - fulfilled with promiseOrValue if it is a value, or
   *  - if promiseOrValue is a promise
   *    - fulfilled with promiseOrValue's value after it is fulfilled
   *    - rejected with promiseOrValue's reason after it is rejected
   */
  function resolve<T>(promise: Promise2<T>): Promise2<T>;
  function resolve<T>(value?: T): Promise2<T>;

  interface Deferred2<T> {
    notify(update: any): void;
    promise: Promise2<T>;
    reject(reason: any): void;
    resolve(value?: T): void;
    resolve(value?: Promise2<T>): void;
  }

  interface Snapshot<T> {
    state: string;
    value?: T;
    reason?: any;
  }
}

declare module "when" {
  export = When
}