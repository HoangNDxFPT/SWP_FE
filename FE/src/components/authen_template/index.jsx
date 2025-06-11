import React from "react";
import LoginForm from "../authen-form/LoginForm";
import RegisterForm from "../authen-form/RegisterForm";

function AuthenTemplate({ isLogin }) {
  return (
    <div className="authen-template">
      <div className="authen-template__form">
        {isLogin ? <LoginForm /> : <RegisterForm />}
      </div>
    </div>
  );
}

export default AuthenTemplate;
