import React, { useEffect } from 'react';
import Cookies from 'js-cookie';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import * as Yup from 'yup';

import ErrorMsg from '../common/error-msg';
import { EmailTwo, LocationTwo, PhoneThree, UserThree } from '@/svg';

import { useUpdateProfileMutation } from '@/redux/features/auth/authApi';
import {
  useGetAddressesQuery,
  useUpdateAddressMutation,
  useCreateAddressMutation,
} from '@/redux/features/address/addressApi';

import { notifyError, notifySuccess } from '@/utils/toast';
import { userLoggedIn } from '@/redux/features/auth/authSlice';

// ✅ validation schema
const schema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  email: Yup.string().required('Email is required').email(),
  phone: Yup.string().required('Phone is required'),
  line1: Yup.string(),
  city: Yup.string(),
  state: Yup.string(),
  pincode: Yup.string(),
  country: Yup.string(),
});

const ProfileInfo = () => {
  const dispatch = useDispatch();

  // ✅ get redux user
  const { user, accessToken } = useSelector((state) => state.auth);

  const [updateProfile] = useUpdateProfileMutation();
  const [updateAddress] = useUpdateAddressMutation();
  const [createAddress] = useCreateAddressMutation();

  // ✅ fetch address
  const { data: addresses } = useGetAddressesQuery(user?.id, {
    skip: !user?.id,
  });

  const address = addresses?.[0];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({ resolver: yupResolver(schema) });

  // ✅ sync redux → form
  useEffect(() => {
    if (!user) return;

    reset({
      name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      line1: address?.line1 || '',
      city: address?.city || '',
      state: address?.state || '',
      pincode: address?.pincode || '',
      country: address?.country || '',
    });
  }, [user, address, reset]);

  // ✅ submit
  const onSubmit = async (data) => {
    if (!user) return;

    try {
      // 1️⃣ update profile
      const res = await updateProfile({
        id: user.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
      }).unwrap();

      // ✅ update redux state

      const payload = {
        accessToken,
        user: res.user,
      };

      // ✅ update redux
      dispatch(userLoggedIn(payload));

      // ✅ update cookie (VERY IMPORTANT)
      Cookies.set('userInfo', JSON.stringify(payload), { expires: 0.5 });

      // 2️⃣ address payload
      const addressPayload = {
        userId: user.id,
        full_name: data.name,
        phone: data.phone,
        line1: data.line1,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        country: data.country,
      };

      // update or create address
      if (address?.id) {
        await updateAddress({ id: address.id, ...addressPayload }).unwrap();
      } else {
        await createAddress(addressPayload).unwrap();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="account-wrapper">
      <form onSubmit={handleSubmit(onSubmit)} className="account-form">
        {/* PERSONAL INFO */}
        <section className="account-card">
          <h2>Personal Information</h2>

          <div className="form-grid">
            <div className="form-field">
              <label>Full Name</label>
              <div className="input">
                <UserThree />
                <input {...register('name')} />
              </div>
              <ErrorMsg msg={errors.name?.message} />
            </div>

            <div className="form-field">
              <label>Email</label>
              <div className="input">
                <EmailTwo />
                <input {...register('email')} />
              </div>
              <ErrorMsg msg={errors.email?.message} />
            </div>

            <div className="form-field full">
              <label>Phone</label>
              <div className="input">
                <PhoneThree />
                <input {...register('phone')} />
              </div>
              <ErrorMsg msg={errors.phone?.message} />
            </div>
          </div>
        </section>

        {/* ADDRESS */}
        <section className="account-card">
          <h2>Address</h2>

          <div className="form-grid">
            <div className="form-field full">
              <label>Address Line</label>
              <div className="input">
                <LocationTwo />
                <input {...register('line1')} />
              </div>
            </div>

            <div className="form-field">
              <label>City</label>
              <input {...register('city')} />
            </div>

            <div className="form-field">
              <label>State</label>
              <input {...register('state')} />
            </div>

            <div className="form-field">
              <label>Pincode</label>
              <input {...register('pincode')} />
            </div>

            <div className="form-field">
              <label>Country</label>
              <input {...register('country')} />
            </div>
          </div>
        </section>

        <div className="account-actions">
          <button type="submit">Save Changes</button>
        </div>
      </form>
    </div>
  );
};

export default ProfileInfo;
