import { EventEmitter } from 'events';
import { FirestorePermissionError } from './errors';

type ErrorEvents = {
  'permission-error': (error: FirestorePermissionError) => void;
};

// We can't use the built-in EventEmitter type because it doesn't
// support our custom event types.
declare interface ErrorEventEmitter {
  on<E extends keyof ErrorEvents>(event: E, listener: ErrorEvents[E]): this;
  off<E extends keyof ErrorEvents>(event: E, listener: ErrorEvents[E]): this;
  emit<E extends keyof ErrorEvents>(
    event: E,
    ...args: Parameters<ErrorEvents[E]>
  ): boolean;
}

class ErrorEventEmitter extends EventEmitter {}

export const errorEmitter = new ErrorEventEmitter();
