import { call, put, take, fork, race } from 'redux-saga/effects';

function delay(millis) {
    const promise = new Promise(resolve => {
        setTimeout(() => resolve(true), millis);
    });
    return promise;
}

function* pollNotifications() {
    try {
        yield call(delay, 5000);
        yield put({
            type: 'notification/APPEND_SOME_REQUEST',
            since: 123, // todo: store timestamp in state & use it here -- action should update timestamp when txn is complete
        });
    } catch (error) {
        // cancellation error -- can handle this if you wish
        return;
    }
}

// Wait for successful response, then fire another request
// Cancel polling if user logs out
function* watchPollData() {
    while (true) {
        yield take([
            'notification/RECEIVE_ALL', // hang out til we get our first batch of notifs...
            'notification/APPEND_SOME', // or after one of the polls are done
        ]);
        yield race([
            call(pollNotifications), // and then queue up
            take('user/LOGOUT'), // or quit if they log out
        ]);
    }
}

export default function* saga() {
    yield [
        fork(watchPollData),
    ];
}
