import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getOAuth2User } from "../../services/authService";
import { useDispatch } from "react-redux";
import { login } from "../../redux/features/userSlice";
import { toast } from "react-toastify";

export default function OAuth2RedirectHandler() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    getOAuth2User()
      .then((user) => {
        console.log("OAuth2 user:", user);
        console.log("Token:", user.token);
        console.log("Email:", user.email);
        console.log("UserName:", user.userName);
        console.log("Role:", user.role?.name || user.role);

        const role = user.role?.name || user.role;
        if (
          !user ||
          !user.token ||
          !user.email ||
          !user.userName ||
          !role
        ) {
          toast.error("Dữ liệu đăng nhập Google không hợp lệ!");
          navigate("/login");
          return;
        }
        const userForStore = { ...user, role };
        localStorage.setItem("token", user.token);
        localStorage.setItem("user", JSON.stringify(userForStore));
        dispatch(login(userForStore));
        toast.success("Đăng nhập Google thành công!");
        navigate("/");
      })
      .catch((err) => {
        toast.error("Đăng nhập Google thất bại!");
        navigate("/login");
      });
    // eslint-disable-next-line
  }, []);

  return <div>Đang đăng nhập bằng Google...</div>;
}