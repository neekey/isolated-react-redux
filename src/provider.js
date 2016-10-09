import { connect } from 'react-redux';
import { addReducer, getStateByKey } from './reducer';
import { clearInstanceState } from './action';
import React from 'react';
import config from './config';

const ISOLATED_ACTION_CREATORS_KEY_NAME = `${config.keyPrefix}actionCreators`;
const ISOLATED_DISPATCH_KEY_NAME = `${config.keyPrefix}dispatch`;
const ISOLATED_KEY_NAME = config.keyName;

function createUniqueKey() {
  return Math.random();
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
      this.props[ISOLATED_DISPATCH_KEY_NAME](clearInstanceState(this.props[ISOLATED_KEY_NAME]));
    }

    render() {
      return <Component {...this.props} />;
    }
  }

  IsolatedComponent.propTypes = {
    dispatch: React.PropTypes.func,
  };

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
  return connect(() => {
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
  }, dispatch => ({ dispatch }), (stateProps, { dispatch }, ownProps) => {
    const actionCreatorsKeyName = ISOLATED_ACTION_CREATORS_KEY_NAME;
    const restStateProps = { ...stateProps };
    const actionCreators = restStateProps[actionCreatorsKeyName];
    delete restStateProps[actionCreatorsKeyName];

    if (mapDispatchToProps) {
      return {
        [ISOLATED_DISPATCH_KEY_NAME]: dispatch,
        ...ownProps,
        ...restStateProps,
        ...mapDispatchToProps(dispatch, ownProps, actionCreators),
      };
    }

    const actionHandlers = {};
    Object.keys(actionCreators).forEach(name => {
      actionHandlers[name] = (...args) => dispatch(actionCreators[name](...args));
    });

    return {
      [ISOLATED_DISPATCH_KEY_NAME]: dispatch,
      ...ownProps,
      ...restStateProps,
      ...actionHandlers,
    };
  })(wrapComponent(component));
}
