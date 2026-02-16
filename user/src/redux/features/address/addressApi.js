import { apiSlice } from '@/redux/api/apiSlice';

export const addressApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // GET addresses
    getAddresses: builder.query({
      query: (userId) => `/userAuth/address?userId=${userId}`,
      providesTags: ['Address'],
    }),

    // CREATE address
    createAddress: builder.mutation({
      query: (data) => ({
        url: '/userAuth/address',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Address'],
      
    }),

    // UPDATE address
    updateAddress: builder.mutation({
      query: (data) => ({
        url: '/userAuth/address',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Address'],
    }),
  }),
});

export const { useGetAddressesQuery, useCreateAddressMutation, useUpdateAddressMutation } = addressApi;
