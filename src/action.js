import config from './config';
const domain = config.domain;

export const CLEAR_INSTANCE_STATE = `${domain}/CLEAR_INSTANCE_STATE`;

export function clearInstanceState(key) {
  return {
    type: CLEAR_INSTANCE_STATE,
    payload: {
      key,
    },
  };
}
