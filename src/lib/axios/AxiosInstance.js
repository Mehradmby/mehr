import axios from "axios";
import TokenService from "../proxies/TokenService";
const instance = axios.create({
  baseURL: "",
  headers: { "Content-Type": "aplication/json" },
});

instance.interceptors.request.use(
  (config) => {
    // here we get access to the first token and put it in to the all instances of axios
    const token = TokenService.getAccessToTheToken();
    if (token) {
      config.headers["token"] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject();
  }
);
instance.interceptors.response.use(
  (res) => {
    return res;
  },
  async (err) => {
    const orginalConfig = err.config;
    //here we check if he is not in sign in page,then if he be,it means he put wrong name and password and its not belong to token
    if (orginalConfig.url !== "/auth/signin" && err.response) {
      //here we check if we get error 401 ,then it means token need to update
      if (err.response.status === 401 && !orginalConfig._retry) {
        orginalConfig._retry = true;
        try {
          //here we get refresh token
          const rs = await instance.post("/auth/refreshtoken", {
            refreshToken: TokenService.getRefreshToken(),
          });
          const { accessToken } = rs.data;
          //here we can update token that is available on every storage
          TokenService.updateLocalStorageToken(accessToken);
          return instance(orginalConfig);
        } catch (error) {
          return Promise.reject();
        }
      }
    }
    return Promise.reject(err);
  }
);
export default AxiosInstance;
