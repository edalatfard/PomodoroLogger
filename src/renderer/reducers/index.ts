import { combineReducers } from 'redux';

import { reducer as timerReducer, TimerState } from '../components/Timer/action';
import { reducer as historyReducer, HistoryState } from '../components/History/action';
import { reducer as kanbanReducer, KanbanState } from '../components/Kanban/reducer';

export interface RootState {
    timer: TimerState;
    history: HistoryState;
    kanban: KanbanState;
}

export const rootReducer = combineReducers<RootState | undefined>({
    timer: timerReducer,
    history: historyReducer,
    kanban: kanbanReducer
});
