import React, { useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import * as Yup from "yup";
// internal
import ErrorMsg from "../common/error-msg";
import { changePassword } from "@/redux/features/auth/authApi";

import Spinner from "../common/Spinner";

// schema
const schema = Yup.object().shape({
  password: Yup.string().required().min(6).label("Password"),
  newPassword: Yup.string().required().min(6).label("New Password"),
  confirmPassword: Yup.string().oneOf(
    [Yup.ref("newPassword"), null],
    "Passwords must match",
  ),
});
// schemaTwo
const schemaTwo = Yup.object().shape({
  newPassword: Yup.string().required().min(6).label("New Password"),
  confirmPassword: Yup.string().oneOf(
    [Yup.ref("newPassword"), null],
    "Passwords must match",
  ),
});

const ChangePassword = () => {
  const { user } = useSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(false);
  // react hook form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(user?.googleSignIn ? schemaTwo : schema),
  });

  // on submit
  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await changePassword({
        email: user?.email,
        password: data.password,
        newPassword: data.newPassword,
        googleSignIn: user?.googleSignIn,
      });
      if (result) {
        reset();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="profile__password">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="row">
          {!user?.googleSignIn && (
            <div className="col-xxl-12">
              <div className="tp-profile-input-box">
                <div className="tp-contact-input">
                  <input
                    {...register("password", {
                      required: `Password is required!`,
                    })}
                    name="password"
                    id="password"
                    type="password"
                  />
                </div>
                <div className="tp-profile-input-title">
                  <label htmlFor="password">Old Password</label>
                </div>
                <ErrorMsg msg={errors.password?.message} />
              </div>
            </div>
          )}
          <div className="col-xxl-6 col-md-6">
            <div className="tp-profile-input-box">
              <div className="tp-profile-input">
                <input
                  {...register("newPassword", {
                    required: `New Password is required!`,
                  })}
                  name="newPassword"
                  id="newPassword"
                  type="password"
                />
              </div>
              <div className="tp-profile-input-title">
                <label htmlFor="new_pass">New Password</label>
              </div>
              <ErrorMsg msg={errors.newPassword?.message} />
            </div>
          </div>
          <div className="col-xxl-6 col-md-6">
            <div className="tp-profile-input-box">
              <div className="tp-profile-input">
                <input
                  {...register("confirmPassword")}
                  name="confirmPassword"
                  id="confirmPassword"
                  type="password"
                />
              </div>
              <div className="tp-profile-input-title">
                <label htmlFor="confirmPassword">Confirm Password</label>
              </div>
              <ErrorMsg msg={errors.confirmPassword?.message} />
            </div>
          </div>
          <div className="col-xxl-6 col-md-6">
            <div className="profile__btn">
              <button type="submit" className="tp-btn" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Spinner size={20} color="white" className="me-2" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;
