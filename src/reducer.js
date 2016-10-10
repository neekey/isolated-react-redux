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

export function getReducerByKey(key) {
  return keyToReducers[key];
}

export function removeReducerByKey(key) {
  delete keyToReducers[key];
}

export function removeStateByKey(key) {
  delete keyToStates[key];
}

function recoverAction(action) {
  delete action.meta[config.keyName];
  return {
    ...action,
    type: action.type.slice(config.keyPrefix.length),
  };
}

export default function UIReducer(state = {}, action) {
  let newState = state;
  if (isIsolatedAction(action)) {
    const key = action.meta[config.keyName];
    const reducer = getReducerByKey(key);

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
    removeStateByKey(key);
    removeReducerByKey(key);
  }

  return newState;
}
