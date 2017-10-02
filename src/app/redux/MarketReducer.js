import {Map} from 'immutable';
import createModule from 'redux-modules';

import { LIQUID_TICKER } from 'app/client_config';

export default createModule({
    name: 'market',
    initialState: Map({
        status: {},
        open_orders_sort: {
            column: 'created',
            dir: -1,
        }
    }),
    transformations: [
        {
            action: 'RECEIVE_ORDERBOOK',
            reducer: (state, action) => {
                return state.set('orderbook', action.payload);
            }
        },
        {
            action: 'RECEIVE_TICKER',
            reducer: (state, action) => {
                return state.set('ticker', action.payload);
            }
        },
        {
            action: 'RECEIVE_OPEN_ORDERS',
            reducer: (state, action) => {
                // Store normalized data right in redux.
                return state.set('open_orders', action.payload.map(o => {
                    const type = o.sell_price.base.indexOf(LIQUID_TICKER) > 0 ? 'ask' : 'bid';
                    return {
                        ...o,
                        type: type,
                        price: parseFloat(type == 'ask' ? o.real_price : o.real_price),
                        steem: type == 'ask' ? o.sell_price.base : o.sell_price.quote,
                        sbd: type == 'bid' ? o.sell_price.base : o.sell_price.quote,
                    };
                }));
            }
        },
        {
            action: 'RECEIVE_TRADE_HISTORY',
            reducer: (state, action) => {
                return state.set('history', action.payload);
            }
        },
        {
            action: 'APPEND_TRADE_HISTORY',
            reducer: (state, action) => {
                return state.set('history', [...action.payload, ...state.get('history')]);
            }
        },
        {
            action: 'TOGGLE_OPEN_ORDERS_SORT',
            reducer: (state, { payload: { column, dataType } }) => {
                // Sort open_orders (side effect, bad maybe?), and then set the sort state
                const dir = state.get('open_orders_sort').dir ? -state.get('open_orders_sort').dir : -1;

                const getValue = (dataType === 'string') ? v => v : parseFloat;

                state.set('open_orders', state.get('open_orders').sort((a, b) => {
                    if (getValue(a[column]) < getValue(b[column])) {
                        return -1 * dir;
                    }

                    if (getValue(a[column]) > getValue(b[column])) {
                        return 1 * dir;
                    }

                    return 0;
                }));

                // initialState doesn't seem to be used, so we can't assume it is set already
                return state.set('open_orders_sort', {
                    column,
                    dir,
                });
            }
        }
    ]
});
