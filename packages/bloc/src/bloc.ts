import {
    Subject,
    BehaviorSubject,
    Observable,
    ObservableInput,
    Subscription,
    PartialObserver
  } from 'rxjs';
  import { filter, tap, pluck, switchMap } from 'rxjs/operators';
  
  export type Transition<T> = {
    current: T;
    next: T;
  };
  
  export abstract class Bloc<E, S> {
    private _event$: Subject<E> = new Subject();
    private _state$: BehaviorSubject<S>;
  
    public get state(): S {
      return this._state$.value;
    }
  
    constructor(initial: S) {
      this._state$ = new BehaviorSubject(initial);
  
      this._transformEvents(this._event$, event => {
        this._onNext(event);
        return this._mapEventToState(event);
      })
        .pipe(switchMap(state => this._transformStates(state)))
        .pipe(
          filter(() => !this._state$.isStopped),
          tap(e => this._onTransition(e)),
          pluck('next')
        )
        .subscribe(this._state$);
    }
  
    public readonly complete = (): void => {
      this._event$.complete();
      this._state$.complete();
    };
  
    public subscribe(next: PartialObserver<S>): Subscription;
    public subscribe(
      next: (value: S) => void,
      error?: (err: any) => void,
      complete?: () => void
    ): Subscription;
  
    /**
     * Subscribe to stream of state changes
     */
    public subscribe(
      next: PartialObserver<S> | ((value: S) => void),
      error?: (err: any) => void,
      complete?: () => void
    ) {
      return next instanceof Function
        ? this._state$.subscribe(next, error, complete)
        : this._state$.subscribe(next);
    }

    protected abstract _mapEventToState(event: E): ObservableInput<S>;

    protected readonly _next = (event: E): void => {
      this._onEvent(event);
      this._event$.next(event);
    };
  
    protected _onEvent(_event: E): void {}
    protected _onNext(_event: E): void {}
    protected _onError(_error: Error): void {}
    protected _onTransition(_transition: Transition<S>): void {}
  
    protected _transformEvents(
      event$: Observable<E>,
      next: (event: E) => ObservableInput<S>
    ): Observable<S> {
      return event$.pipe(switchMap(next));
    }
  
    protected *_transformStates(next: S): ObservableInput<Transition<S>> {
      const current = this.state;
      if (current !== next) {
        yield { current, next };
      }
    }
  }
  
  export default Bloc;
  