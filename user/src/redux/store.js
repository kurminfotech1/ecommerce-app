import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer';

const store = configureStore({
  reducer: rootReducer,
});

export default store;

// import { configureStore } from '@reduxjs/toolkit';
//  import { apiSlice } from './api/apiSlice';
//   import rootReducer from './rootReducer'; 
//   const store = configureStore({ 
//     reducer: rootReducer, 
//     middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware), 
// }); 
// export default store;