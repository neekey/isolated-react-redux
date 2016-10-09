import config from './config';
import * as actions from './action';

const keyToReducers = {};
const keyToStates = {};

function isIsolatedAction(action) {
  return !!action.type.match(config.keyPrefix) && action.meta && action.meta[config.keyName];
}

export function addReducer(key, reducer) {
  keyToReducers[key] = reducer;
}

export function getStateByKey(key) {
  return keyToStates[key];
}

function recoverAction(action) {
  return {
    ...action,
    type: action.type.slice(config.keyPrefix.length),
  };
}

export default function UIReducer(state = {}, action) {
  let newState = state;
  if (isIsolatedAction(action)) {
    const key = action.meta[config.keyName];
    const reducer = keyToReducers[key];

    if (reducer) {
      const newInstanceState = reducer(state[key], recoverAction(action));

      if (state[key] !== newInstanceState) {
        newState = {
          ...state,
          [key]: newInstanceState,
        };
      }
      keyToStates[key] = newState[key];
    }
  }

  if (action.type === actions.CLEAR_INSTANCE_STATE) {
    const key = action.payload.key;
    newState = { ...newState };
    delete newState[key];
    delete keyToStates[key];
    delete keyToReducers[key];
  }

  return newState;
}
