import React, { useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useSelector, useDispatch } from "react-redux";
import { Rating } from "react-simple-star-rating";
import * as Yup from "yup";
// internal
import ErrorMsg from "../common/error-msg";
import { addReview } from "@/redux/features/reviews/ReviewsApi";
import { notifyError } from "@/utils/toast";

// schema
const schema = Yup.object().shape({
  title: Yup.string().required("Review summary is required!").label("Title"),
  comment: Yup.string().required("Comment is required!").label("Comment"),
});

const ReviewForm = ({ product_id }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { loading } = useSelector((state) => state.reviews);
  const [rating, setRating] = useState(0);

  // Catch Rating value
  const handleRating = (rate) => {
    setRating(rate);
  };

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
    if (!user) {
      notifyError("Please login to submit a review");
      return;
    }
    if (rating === 0) {
      notifyError("Please select a rating");
      return;
    }

    dispatch(
      addReview({
        product_id,
        rating: rating,
        title: data.title,
        body: data.comment,
      }),
    ).then((result) => {
      // Only clear if successful
      if (!result.error) {
        reset();
        setRating(0);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="tp-product-details-review-form-rating d-flex align-items-center">
        <p>Your Rating :</p>
        <div className="tp-product-details-review-form-rating-icon d-flex align-items-center">
          <Rating
            onClick={handleRating}
            allowFraction
            size={16}
            initialValue={rating}
          />
        </div>
      </div>
      <div className="tp-product-details-review-input-wrapper">
        <div className="tp-product-details-review-input-box">
          <div className="tp-product-details-review-input">
            <textarea
              {...register("comment", { required: `Comment is required!` })}
              id="comment"
              name="comment"
              placeholder="Write your review here..."
            />
          </div>
          <div className="tp-product-details-review-input-title">
            <label htmlFor="msg">Your Review</label>
          </div>
          <ErrorMsg msg={errors.name?.comment} />
        </div>
        <div className="tp-product-details-review-input-box">
          <div className="tp-product-details-review-input">
            <input
              {...register("title", { required: `Title is required!` })}
              name="title"
              id="title"
              type="text"
              placeholder="Summary of your review"
            />
          </div>
          <div className="tp-product-details-review-input-title">
            <label htmlFor="title">Review Title</label>
          </div>
          <ErrorMsg msg={errors.title?.message} />
        </div>
      </div>
      <div className="tp-product-details-review-btn-wrapper">
        <button
          type="submit"
          disabled={loading}
          className="tp-product-details-review-btn"
        >
          {loading ? "Submitting..." : "Submit Review"}
        </button>
      </div>
    </form>
  );
};

export default ReviewForm;
