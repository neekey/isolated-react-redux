import {expect} from 'chai';
import reducer, * as reducerFuncs from '../src/reducer';
import * as actions from '../src/action';
import sinon from 'sinon';
import config from '../src/config';

describe('Reducer', () => {
  it('should be able to add reducer and get reducer', () => {
    const instanceReducer = () => {
    };
    const key = Math.random();
    reducerFuncs.addReducer(key, instanceReducer);
    expect(reducerFuncs.getReducerByKey(key)).to.deep.equal(instanceReducer);
  });

  it('should be able to handle isolated action', () => {
    const instanceReducerRet = {};
    const instanceReducer = sinon.spy(() => (instanceReducerRet));
    const key = Math.random();
    reducerFuncs.addReducer(key, instanceReducer);
    const actionName = 'actionName';
    const action = {
      type: `${config.keyPrefix}${actionName}`,
      meta: {
        [config.keyName]: key,
      },
    };
    const rootState = {};
    const result = reducer(rootState, action);
    expect(result[key]).to.equal(instanceReducerRet);
    expect(instanceReducer.calledWith(undefined, { type: actionName, meta: {}})).to.equal(true);
    expect(reducerFuncs.getStateByKey(key)).to.equal(instanceReducerRet);
  });

  it('should be able to handle action CLEAR_INSTANCE_STATE', () => {
    const key = Math.random();
    const action = {
      type: actions.CLEAR_INSTANCE_STATE,
      payload: {
        key,
      },
    };
    const rootState = {
      [key]: {},
    };
    const result = reducer(rootState, action);
    expect(result[key]).to.equal(undefined);
    expect(reducerFuncs.getStateByKey(key)).to.equal(undefined);
    expect(reducerFuncs.getReducerByKey(key)).to.equal(undefined);
  });
});
