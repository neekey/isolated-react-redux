import { connect } from 'react-redux';
import { addReducer, getStateByKey } from './reducer';
import { clearInstanceState } from './action';
import React from 'react';
import config from './config';

const ISOLATED_KEY_NAME = config.keyName;
const ISOLATED_ACTION_CREATORS_KEY_NAME = Symbol('actionCreators');
const ISOLATED_COMPONENT_UNMOUNT = Symbol('onUnmount');

function createUniqueKey() {
  return Symbol(config.keyName);
}

function wrapAction(key, action) {
  return {
    ...action,
    type: config.keyPrefix + action.type,
    meta: {
      ...action.meta,
      [ISOLATED_KEY_NAME]: key,
    },
  };
}

function wrapComponent(Component) {
  class IsolatedComponent extends React.Component {
    componentWillUnmount() {
      this.props[ISOLATED_COMPONENT_UNMOUNT]();
    }

    render() {
      const props = { ...this.props};
      delete props.onUnmount;
      return <Component {...props} />;
    }
  }

  const displayName = Component.displayName || Component.name || 'Component';
  IsolatedComponent.displayName = `${config.domain}(${displayName})`;

  return IsolatedComponent;
}

export default function provider({
  key,
  reducer,
  actions,
  component,
  mapStateToProps,
  mapDispatchToProps,
}) {
  const hasPersistentKey = typeof key !== 'undefined';

  function _mapStateToProps() {
    let uniqueKey = key;
    if (!uniqueKey) {
      uniqueKey = createUniqueKey();
    }

    const actionCreators = {};
    Object.keys(actions).forEach(actionName => {
      actionCreators[actionName] = (...args) => {
        const originAction = actions[actionName](...args);
        return wrapAction(uniqueKey, originAction);
      };
    });

    addReducer(uniqueKey, reducer);
    return (...args) => {
      const uiState = getStateByKey(uniqueKey);
      return {
        ...(mapStateToProps ? mapStateToProps(...args, uiState) : uiState),
        [ISOLATED_ACTION_CREATORS_KEY_NAME]: actionCreators,
        [ISOLATED_KEY_NAME]: uniqueKey,
      };
    };
  }

  function _mapDispatchToProps(dispatch) {
    return {
      dispatch,
    };
  }

  function _mergeProps(stateProps, { dispatch }, ownProps) {
    const restStateProps = { ...stateProps };
    const actionCreators = restStateProps[ISOLATED_ACTION_CREATORS_KEY_NAME];
    delete restStateProps[ISOLATED_ACTION_CREATORS_KEY_NAME];
    const instanceKey = stateProps[ISOLATED_KEY_NAME];
    delete stateProps[ISOLATED_KEY_NAME];

    if (mapDispatchToProps) {
      return {
        ...ownProps,
        ...restStateProps,
        ...mapDispatchToProps(dispatch, ownProps, actionCreators),
        [ISOLATED_COMPONENT_UNMOUNT]: () => {
          if (!hasPersistentKey) {
            dispatch(clearInstanceState(instanceKey));
          }
        },
      };
    }

    const actionHandlers = {};
    Object.keys(actionCreators).forEach(name => {
      actionHandlers[name] = (...args) => dispatch(actionCreators[name](...args));
    });

    return {
      ...ownProps,
      ...restStateProps,
      ...actionHandlers,
    };
  }

  return connect(_mapStateToProps, _mapDispatchToProps, _mergeProps)(wrapComponent(component, hasPersistentKey));
}
