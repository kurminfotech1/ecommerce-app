import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useRouter } from 'next/router';
// internal
import { CloseEye, OpenEye } from '@/svg';
import ErrorMsg from '../common/error-msg';
import { notifyError, notifySuccess } from '@/utils/toast';
import { useRegisterUserMutation } from '@/redux/features/auth/authApi';

// schema
const schema = Yup.object().shape({
  full_name: Yup.string().required().label('Name'),
  email: Yup.string().required().email().label('Email'),
  phone: Yup.string().required().label('Phone'),
  password: Yup.string().required().min(6).label('Password'),
  remember: Yup.bool().oneOf([true], 'You must agree to the terms and conditions to proceed.'),
});

const RegisterForm = () => {
  const [showPass, setShowPass] = useState(false);
  const [registerUser, {}] = useRegisterUserMutation();
  const router = useRouter();
  const { redirect } = router.query;

  // react hook form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
  });

  // on submit
  const onSubmit = (data) => {
    registerUser({
      full_name: data.full_name,
      email: data.email,
      password: data.password,
      phone: data.phone,
    }).then((result) => {
      if (result?.error) {
        notifyError('Register Failed');
      } else {
        notifySuccess('Register successful');
        router.push('/login');
      }
    });

    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="tp-login-input-wrapper">
        <div className="tp-login-input-box">
          <div className="tp-login-input">
            <input
              {...register('full_name', { required: `Fullname is required!` })}
              id="name"
              name="name"
              type="text"
              placeholder="Shahnewaz Sakil"
            />
          </div>
          <div className="tp-login-input-title">
            <label htmlFor="name">Your Name</label>
          </div>
          <ErrorMsg msg={errors.full_name?.message} />
        </div>

        <div className="tp-login-input-box">
          <div className="tp-login-input">
            <input
              {...register('email', { required: `Email is required!` })}
              id="email"
              name="email"
              type="email"
              placeholder="shofy@mail.com"
            />
          </div>
          <div className="tp-login-input-title">
            <label htmlFor="email">Your Email</label>
          </div>
          <ErrorMsg msg={errors.email?.message} />
        </div>

        <div className="tp-login-input-box">
          <div className="tp-login-input">
            <input {...register('phone')} type="text" placeholder="Phone number" />
          </div>
          <div className="tp-login-input-title">
            <label>Phone</label>
          </div>
          <ErrorMsg msg={errors.phone?.message} />
        </div>

        <div className="tp-login-input-box">
          <div className="p-relative">
            <div className="tp-login-input">
              <input
                {...register('password', { required: `Password is required!` })}
                id="password"
                name="password"
                type={showPass ? 'text' : 'password'}
                placeholder="Min. 6 character"
              />
            </div>
            <div className="tp-login-input-eye" id="password-show-toggle">
              <span className="open-eye" onClick={() => setShowPass(!showPass)}>
                {showPass ? <CloseEye /> : <OpenEye />}
              </span>
            </div>
            <div className="tp-login-input-title">
              <label htmlFor="password">Password</label>
            </div>
          </div>
          <ErrorMsg msg={errors.password?.message} />
        </div>
      </div>
      <div className="tp-login-suggetions d-sm-flex align-items-center justify-content-between mb-20">
        <div className="tp-login-remeber">
          <input
            {...register('remember', {
              required: `Terms and Conditions is required!`,
            })}
            id="remember"
            name="remember"
            type="checkbox"
          />
          <label htmlFor="remember">
            I accept the terms of the Service & <a href="#">Privacy Policy</a>.
          </label>
          <ErrorMsg msg={errors.remember?.message} />
        </div>
      </div>
      <div className="tp-login-bottom">
        <button type="submit" className="tp-login-btn w-100">
          Sign Up
        </button>
      </div>
    </form>
  );
};

export default RegisterForm;
