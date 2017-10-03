import { Map, fromJS } from 'immutable';
import createModule from 'redux-modules';

import { createOrderSorter } from 'app/utils/MarketUtils';
import { LIQUID_TICKER } from 'app/client_config';

export default createModule({
    name: 'market',
    initialState: Map({
        status: {},
        open_orders_sort: {
            column: 'created',
            dataType: 'string',
            dir: 1,
        },
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
                // Store normalized data right in redux, and apply current sort.
                const { dir, column, dataType } = state.get('open_orders_sort').toJS();
                const getValue = (dataType === 'string') ? v => v : parseFloat;

                const open_orders = action.payload
                .map(o => {
                    const type = o.sell_price.base.indexOf(LIQUID_TICKER) > 0 ? 'ask' : 'bid';
                    return {
                        ...o,
                        type: type,
                        price: parseFloat(type == 'ask' ? o.real_price : o.real_price),
                        steem: type == 'ask' ? o.sell_price.base : o.sell_price.quote,
                        sbd: type == 'bid' ? o.sell_price.base : o.sell_price.quote,
                    };
                })
                .sort(createOrderSorter(getValue, column, dir));

                return state.set('open_orders', open_orders);
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
            reducer: (state, { payload: { column = 'created', dataType = 'float' } }) => {
                const dir = -state.get('open_orders_sort').get('dir');

                const getValue = (dataType === 'string') ? v => v : parseFloat;

                state.set('open_orders', state.get('open_orders').sort(createOrderSorter(getValue, column, dir)));

                return state.set('open_orders_sort', fromJS({
                    column,
                    dataType,
                    dir,
                }));
            }
        }
    ]
});
