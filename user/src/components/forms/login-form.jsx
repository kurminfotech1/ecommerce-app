import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { useRouter } from "next/router";
import Link from "next/link";
// internal
import { CloseEye, OpenEye } from "@/svg";
import Spinner from "../common/Spinner";
import ErrorMsg from "../common/error-msg";
import { loginUser } from "@/redux/features/auth/authApi";
import { useDispatch } from "react-redux";
import { userLoggedIn } from "@/redux/features/auth/authSlice";

// schema
const schema = Yup.object().shape({
  email: Yup.string().required().email().label("Email"),
  password: Yup.string().required().min(6).label("Password"),
});

const LoginForm = () => {
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
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
    setIsLoading(true);
      loginUser({
        email: data.email,
        password: data.password,
      })
        .then((result) => {
          setIsLoading(false);
          if (result) {
            dispatch(userLoggedIn(result));
            router.push(redirect || "/");
          }
        })
        .catch((err) => {
          setIsLoading(false);
          console.error("Login Error:", err);
        });

    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="tp-login-input-wrapper">
        <div className="tp-login-input-box">
          <div className="tp-login-input">
            <input
              {...register("email", { required: `Email is required!` })}
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
                {...register("password", { required: `Password is required!` })}
                id="password"
                type={showPass ? "text" : "password"}
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
        <button
          type="submit"
          disabled={isLoading}
          className="tp-login-btn w-100 d-flex align-items-center justify-content-center"
        >
          {isLoading ? (
            <>
              <Spinner size={20} color="white" className="me-2" />
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
