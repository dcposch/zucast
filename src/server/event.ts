export type Listener<T> = (event: T) => unknown;

export class TypedEvent<T> {
  private listeners: Listener<T>[] = [];

  on = (listener: Listener<T>) => this.listeners.push(listener);

  off = (listener: Listener<T>) => {
    var callbackIndex = this.listeners.indexOf(listener);
    if (callbackIndex > -1) this.listeners.splice(callbackIndex, 1);
  };

  emit = (event: T) => {
    this.listeners.forEach((listener) => listener(event));
  };
}
