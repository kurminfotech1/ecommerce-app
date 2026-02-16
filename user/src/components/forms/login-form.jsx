import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useRouter } from 'next/router';
import Link from 'next/link';
// internal
import { CloseEye, OpenEye } from '@/svg';
import ErrorMsg from '../common/error-msg';
import { useLoginUserMutation } from '@/redux/features/auth/authApi';
import { notifyError, notifySuccess } from '@/utils/toast';

// schema
const schema = Yup.object().shape({
  email: Yup.string().required().email().label('Email'),
  password: Yup.string().required().min(6).label('Password'),
});
const LoginForm = () => {
  const [showPass, setShowPass] = useState(false);
  const [loginUser, {}] = useLoginUserMutation();
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

  // onSubmit
  const onSubmit = (data) => {
    loginUser({
      email: data.email,
      password: data.password,
    }).then((result) => {
      if (result?.data) {
        notifySuccess('Login successfully');
        router.push(redirect || '/');
      } else {
        notifyError(result?.error?.data?.error || 'Login failed');
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
              {...register('email', { required: `Email is required!` })}
              name="email"
              id="email"
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
          <div className="p-relative">
            <div className="tp-login-input">
              <input
                {...register('password', { required: `Password is required!` })}
                id="password"
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
          <input id="remeber" type="checkbox" />
          <label htmlFor="remeber">Remember me</label>
        </div>
        <div className="tp-login-forgot">
          <Link href="/forgot">Forgot Password?</Link>
        </div>
      </div>
      <div className="tp-login-bottom">
        <button type="submit" className="tp-login-btn w-100">
          Login
        </button>
      </div>
    </form>
  );
};

export default LoginForm;

// import { useRegisterUserMutation } from "@/redux/features/auth/authApi";
// import { useState } from "react";

// export default function LoginForm() {
//   const [registerUser, { isLoading, error }] =
//     useRegisterUserMutation();

//   const [form, setForm] = useState({
//     name: "",
//     email: "",
//     password: "",
//   });

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       await registerUser(form).unwrap();
//       alert("Registration successful");
//     } catch (err) {
//       alert(err?.data?.message || "Registration failed");
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit}>
//       <input
//         placeholder="Name"
//         onChange={(e) =>
//           setForm({ ...form, name: e.target.value })
//         }
//       />
//       <input
//         placeholder="Email"
//         type="email"
//         onChange={(e) =>
//           setForm({ ...form, email: e.target.value })
//         }
//       />
//       <input
//         placeholder="Password"
//         type="password"
//         onChange={(e) =>
//           setForm({ ...form, password: e.target.value })
//         }
//       />
//       <button type="submit" disabled={isLoading}>
//         Register
//       </button>
//     </form>
//   );
// }
