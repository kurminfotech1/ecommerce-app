import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import * as Yup from "yup";

import ErrorMsg from "../common/error-msg";
import { EmailTwo, LocationTwo, PhoneThree, UserThree } from "@/svg";

import { updateUserProfile } from "@/redux/features/auth/authApi";
import {
  getAddresses,
  updateAddress,
  createAddress,
} from "@/redux/features/address/addressApi";

import { userLoggedIn } from "@/redux/features/auth/authSlice";
import Spinner from "../common/Spinner";

// ✅ validation schemas
const personalSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  email: Yup.string().required("Email is required").email(),
  phone: Yup.string().required("Phone is required"),
});

const addressSchema = Yup.object().shape({
  line1: Yup.string().required("Address is required"),
  city: Yup.string().required("City is required"),
  state: Yup.string().required("State is required"),
  pincode: Yup.string().required("Pincode is required"),
  country: Yup.string().required("Country is required"),
});

const ProfileInfo = () => {
  const dispatch = useDispatch();
  const [addresses, setAddresses] = useState([]);
   const [isLoading, setIsLoading] = useState(false);
  // ✅ get redux user
  const { user, accessToken } = useSelector((state) => state.auth);

  // ✅ fetch address
  useEffect(() => {
    if (!user?.id) return;

    const fetch = async () => {
      try {
        const data = await getAddresses(user.id);
        setAddresses(data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetch();
  }, [user?.id]);

  const address = addresses?.[0];

  // ✅ Form 1: Personal Info
  const {
    register: registerPersonal,
    handleSubmit: handlePersonalSubmit,
    formState: { errors: personalErrors },
    reset: resetPersonal,
  } = useForm({ resolver: yupResolver(personalSchema) });

  // ✅ Form 2: Address Info
  const {
    register: registerAddress,
    handleSubmit: handleAddressSubmit,
    formState: { errors: addressErrors },
    reset: resetAddress,
  } = useForm({ resolver: yupResolver(addressSchema) });

  // ✅ sync redux → form (Personal)
  useEffect(() => {
    if (user) {
      resetPersonal({
        name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user, resetPersonal]);

  // ✅ sync address → form (Address)
  useEffect(() => {
    if (address) {
      resetAddress({
        line1: address.line1 || "",
        city: address.city || "",
        state: address.state || "",
        pincode: address.pincode || "",
        country: address.country || "",
      });
    }
  }, [address, resetAddress]);

  // ✅ handle personal update
  const onPersonalSubmit = async (data) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await updateUserProfile({
        id: user.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
      });

      if (res) {
        const payload = { accessToken, user: res.user };
        dispatch(userLoggedIn(payload));
        Cookies.set("userInfo", JSON.stringify(payload), { expires: 0.5 });
      }
    } catch (err) {
      console.error(err);
    }
    finally{
      setIsLoading(false);
    }
  };

  // ✅ handle address update
  const onAddressSubmit = async (data) => {
    if (!user) return;
      setIsLoading(true);
    try {
      const addressPayload = {
        userId: user.id,
        full_name: user.full_name, // Use current user info
        phone: user.phone,
        ...data,
      };

      if (address?.id) {
        await updateAddress({ id: address.id, ...addressPayload });
      } else {
        await createAddress(addressPayload);
      }

      // Refresh addresses
      const updatedAddresses = await getAddresses(user.id);
      setAddresses(updatedAddresses || []);
    } catch (err) {
      console.error(err);
       
    }
    finally{
      setIsLoading(false);
    }
  };

  return (
    <div className="account-wrapper">
      {/* PERSONAL INFO FORM */}
      <form
        onSubmit={handlePersonalSubmit(onPersonalSubmit)}
        className="account-form mb-30"
      >
        <section className="account-card">
          <h2>Personal Information</h2>
          <div className="form-grid">
            <div className="form-field">
              <label>Full Name</label>
              <div className="input">
                <UserThree />
                <input {...registerPersonal("name")} />
              </div>
              <ErrorMsg msg={personalErrors.name?.message} />
            </div>

            <div className="form-field">
              <label>Email</label>
              <div className="input">
                <EmailTwo />
                <input {...registerPersonal("email")} />
              </div>
              <ErrorMsg msg={personalErrors.email?.message} />
            </div>

            <div className="form-field full">
              <label>Phone</label>
              <div className="input">
                <PhoneThree />
                <input {...registerPersonal("phone")} />
              </div>
              <ErrorMsg msg={personalErrors.phone?.message} />
            </div>
          </div>
          <div className="account-actions mt-20">
            <button type="submit" className="tp-btn" disabled={isLoading}>
                {isLoading ? (
            <>
              <Spinner size={20} color="white" className="me-2" />
              Updating...
            </>
          ) : (
            "Update Profile"
          )}
            </button>
          </div>
        </section>
      </form>

      {/* ADDRESS FORM */}
      <form
        onSubmit={handleAddressSubmit(onAddressSubmit)}
        className="account-form"
      >
        <section className="account-card">
          <h2>Address Information</h2>
          <div className="form-grid">
            <div className="form-field full">
              <label>Address Line</label>
              <div className="input">
                <LocationTwo />
                <input {...registerAddress("line1")} />
              </div>
              <ErrorMsg msg={addressErrors.line1?.message} />
            </div>

            <div className="form-field">
              <label>City</label>
              <input {...registerAddress("city")} />
              <ErrorMsg msg={addressErrors.city?.message} />
            </div>

            <div className="form-field">
              <label>State</label>
              <input {...registerAddress("state")} />
              <ErrorMsg msg={addressErrors.state?.message} />
            </div>

            <div className="form-field">
              <label>Pincode</label>
              <input {...registerAddress("pincode")} />
              <ErrorMsg msg={addressErrors.pincode?.message} />
            </div>

            <div className="form-field">
              <label>Country</label>
              <input {...registerAddress("country")} />
              <ErrorMsg msg={addressErrors.country?.message} />
            </div>
          </div>
          <div className="account-actions mt-20">
            <button type="submit" className="tp-btn" disabled={isLoading}>
               {isLoading ? (
            <>
              <Spinner size={20} color="white" className="me-2" />
              Updating...
            </>
          ) : (
            "Update Address"
          )}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
};

export default ProfileInfo;
