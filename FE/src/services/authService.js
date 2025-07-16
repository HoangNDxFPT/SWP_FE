import api from "../config/axios";

export const getOAuth2User = async () => {
  const res = await api.get("/../auth/oauth2/success");
  return res.data;
};