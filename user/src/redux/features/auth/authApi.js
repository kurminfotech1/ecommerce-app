import { apiSlice } from '@/redux/api/apiSlice';
import { userLoggedIn } from './authSlice';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

export const authApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // REGISTER
    registerUser: builder.mutation({
      query: (data) => ({
        url: '/userAuth/register',
        method: 'POST',
        body: data,
      }),
    }),

    // LOGIN
    loginUser: builder.mutation({
      query: (data) => ({
        url: '/userAuth/login',
        method: 'POST',
        body: data,
      }),

      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;

          const payload = {
            accessToken: result.data.token,
            user: result.data.user,
          };

          Cookies.set('userInfo', JSON.stringify(payload), { expires: 1 });

          dispatch(userLoggedIn(payload));
        } catch (err) {
          console.error(err);
        }
      },
    }),

    updateProfile: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/userAuth/update/${id}`,
        method: 'PUT',
        body: data,
      }),

      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          toast.success(data?.message);
        } catch (error) {
          toast.error(error?.error?.data?.error);
        }
      },
    }),

    changePassword: builder.mutation({
      query: (data) => ({
        url: '/userAuth/change-password',
        method: 'PATCH',
        body: data,
      }),
    }),
  }),
});

export const { useLoginUserMutation, useRegisterUserMutation, useUpdateProfileMutation, useChangePasswordMutation } =
  authApi;
