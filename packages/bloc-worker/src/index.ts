import { Bloc, Transition } from '@codin/bloc';
import { delay, distinct, map, filter } from 'rxjs/operators';
import {
  ObservableInput,
  Subject,
  of,
  SchedulerLike,
  asapScheduler
} from 'rxjs';

/* === Events === */
export type WorkerEventType = 'update' | 'execute' | 'commit';

export interface WorkerEvent {
  type: WorkerEventType;
  runtime: number;
}

export interface WorkerEventCommit<R> extends WorkerEvent {
  result: R;
}

/* === State === */
export type WorkerStateType = 'initial' | 'executing' | 'executed' | 'complete';

export interface WorkerState {
  readonly runtime: number;
  readonly type: WorkerStateType;
}

export interface WorkerStateCommit<R> extends WorkerState {
  readonly result?: R;
}

/* === Transition === */
export type WorkerTransition = Transition<WorkerState>;

export class Worker<R = any> extends Bloc<WorkerEvent, WorkerState> {
  private _update$ = new Subject<number>();
  public get runtime() {
    return this.state.runtime;
  }
  constructor(
    protected _task: (worker: Worker<R>) => R,
    protected _scheduler: SchedulerLike = asapScheduler
  ) {
    super({ type: 'initial', runtime: 0 });

    this._update$
      .pipe(
        delay(0, this._scheduler),
        distinct(),
        map(runtime => ({
          type: 'execute',
          runtime
        } as WorkerEvent))
      )
      .subscribe(e => this.next(e));
  }

  public update() {
    const { runtime } = this;
    this._onEvent({ type: 'update', runtime });
    this._update$.next(runtime);
  }

  public async requestUpdate(): Promise<WorkerStateCommit<R>> {
    this.update();
    return new Promise<WorkerStateCommit<R>>(resolve => {
      this.subscribe(next =>
        of(next)
          .pipe(filter(e => e.type === 'complete'))
          .subscribe(resolve)
          .unsubscribe()
      );
    });
  }

  protected *_mapEventToState(
    event: WorkerEvent
  ): ObservableInput<WorkerState> {
    switch (event.type) {
      case 'execute':
        yield {
          type: 'executing',
          runtime: this.runtime + 1
        };
        yield* this._execute(this.runtime);
        break;
      case 'commit':
        yield {
          type: 'complete',
          runtime: event.runtime,
          result: (event as WorkerEventCommit<R>).result
        } as WorkerStateCommit<R>;
        break;
    }
  }

  protected *_execute(runtime: number) {
    const result = this._task.call(this, this);
    yield {
      type: 'executed',
      runtime
    } as WorkerState;
    this._scheduler.schedule(() => {
      if (this.runtime === runtime) {
        super.next({
          type: 'commit',
          runtime,
          result
        } as WorkerEventCommit<R>);
      }
    });
  }
}

export default Worker;
