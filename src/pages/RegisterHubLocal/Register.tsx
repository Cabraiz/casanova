import React, { FC, useEffect, useState, FormEvent } from "react";

import Login_Logo from "../../assets/HubLocal/Login_Logo.webp";
import Login_Image from "../../assets/HubLocal/Login_Image.webp";

import { toast } from "react-toastify";
import {
  Button,
  InputGroup,
  Stack,
  Box,
  FormControl,
  Text,
  Link,
  FormLabel,
} from "@chakra-ui/react";
import {
  reset,
  register,
  tokenReceived,
} from "../../redux/feature/auth/authSlice";
import {
  LoginRequest,
  useLoginMutation,
} from "../../redux/feature/auth/authApiSlice";
import { isMobile } from "react-device-detect";
import useInput from "../../redux/hooks/input/use-input";
import {
  validateNameLength,
  validatePasswordLength,
} from "../../redux/shared/utils/validation/lenght";
import { validateEmail } from "../../redux/shared/utils/validation/email";
import { NewUser } from "../../redux/app/models/NewUser";

import { RegisterParams } from "../Auxiliadores/models/ModeloJSXPage.interface";
import {
  ModeloLadoEsquerdoPage,
  ModeloLadoDireitoPage,
  LoadingPage,
} from "../Auxiliadores/ModeloJSXPage";
import { useAppDispatch, useAppSelector } from "../../redux/hooks/hooks";
import { useNavigate } from "react-router-dom";

import { ProtectedComponent } from "../../redux/feature/auth/ProtectedComponent";
import "./Register.css";

function NomeInput({
  value,
  onChange,
  onBlur,
  error,
  helperText,
}: RegisterParams) {
  return (
    <>
      {ModeloLadoDireitoPage({
        value,
        onChange,
        onBlur,
        error,
        helperText,
        type: "text",
        name: "name",
        id: "name",
      })}
    </>
  );
}

function EmailInput({
  value,
  onChange,
  onBlur,
  error,
  helperText,
}: RegisterParams) {
  return (
    <>
      {ModeloLadoDireitoPage({
        value,
        onChange,
        onBlur,
        error,
        helperText,
        type: "text",
        name: "email",
        id: "email",
      })}
    </>
  );
}

function PasswordInput({
  value,
  onChange,
  onBlur,
  error,
  helperText,
}: RegisterParams) {
  return (
    <>
      {ModeloLadoDireitoPage({
        value,
        onChange,
        onBlur,
        error,
        helperText,
        type: "password",
        name: "password",
        id: "password",
        placeholder: "Mínimo de 6 caracteres",
      })}
    </>
  );
}

function ConfirmPasswordInput({
  value,
  onChange,
  onBlur,
  error,
  helperText,
}: RegisterParams) {
  return (
    <>
      {ModeloLadoDireitoPage({
        value,
        onChange,
        onBlur,
        error,
        helperText,
        type: "password",
        name: "password",
        id: "confirmpassword",
        placeholder: "Mínimo de 6 caracteres",
      })}
    </>
  );
}

function Register() {
  const {
    text: name,
    shouldDisplayError: nameHasError,
    textChangeHandler: nameChangeHandler,
    inputBlurHandler: nameBlurHandler,
    clearHandler: nameClearHandler,
  } = useInput(validateNameLength);

  const {
    text: email,
    shouldDisplayError: emailHasError,
    textChangeHandler: emailChangeHandler,
    inputBlurHandler: emailBlurHandler,
    clearHandler: emailClearHandler,
  } = useInput(validateEmail);

  const {
    text: password,
    shouldDisplayError: passwordHasError,
    textChangeHandler: passwordChangeHandler,
    inputBlurHandler: passwordBlurHandler,
    clearHandler: passwordClearHandler,
  } = useInput(validatePasswordLength);

  const {
    text: confirmPassword,
    shouldDisplayError: confirmPasswordHasError,
    textChangeHandler: confirmPasswordChangeHandler,
    inputBlurHandler: confirmPasswordBlurHandler,
    clearHandler: confirmPasswordClearHandler,
  } = useInput(validatePasswordLength);

  const [realHeight, setrealHeight] = useState("");
  const [isAnimationSet, setAnimationSet] = useState(false);

  useEffect(() => {
    setAnimationSet(true);
  }, []);

  useEffect(() => {
    if (isMobile) setrealHeight(`${window.innerHeight}px`);
    else {
      setrealHeight("100vh");
    }
  }, [realHeight]);

  const clearForm = () => {
    nameClearHandler();
    emailClearHandler();
    passwordClearHandler();
    confirmPasswordClearHandler();
  };

  const ErrorNotify = (message: string) =>
    toast.warn(message, {
      position: isMobile ? "top-center" : "bottom-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "dark",
    });

  const [login, { isLoading }] = useLoginMutation();

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  //const { isLoading, isSuccess } = useAppSelector((state) => state.auth)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors: string[] = [];

    if (password !== confirmPassword) {
      errors.push("Senhas não correspondem");
    }

    if (
      nameHasError ||
      emailHasError ||
      passwordHasError ||
      confirmPasswordHasError
    ) {
      errors.push("Preencha campos corretamente");
    }

    if (
      name.length === 0 ||
      email.length === 0 ||
      password.length === 0 ||
      confirmPassword.length === 0
    ) {
      errors.push("Preencha todos os campos");
    }

    if (errors.length > 0) {
      ErrorNotify(errors[0]);
      return;
    }

    try {
      const newUser: NewUser = {
        name,
        email,
        password,
      };

      const response = dispatch(register(newUser) as any);
      const user = response.payload;
      if (user) {
        dispatch(tokenReceived(user.token));
        dispatch(reset());
        clearForm();
        navigate("/loginhublocal");
      } else {
        ErrorNotify("Houve um erro ao tentar cadastrar o usuário");
      }
    } catch (error) {
      console.error(error);
      ErrorNotify("Houve um erro ao tentar cadastrar o usuário");
    }
  };

  const content = isLoading ? (
    <LoadingPage />
  ) : (
    <>
      <Box minW={{ md: "31vw" }} style={{ marginTop: "0" }}>
        <form onSubmit={handleSubmit} autoComplete="off">
          <Stack
            w={{ base: "90vw", md: "auto" }}
            spacing={2}
            backgroundColor="whiteAlpha.900"
          >
            <FormControl isRequired>
              <FormLabel className="letter-spacing-text poppins-text-label text-pattern">
                Nome
              </FormLabel>
              <InputGroup className="input-pattern">
                <NomeInput
                  value={name}
                  onChange={nameChangeHandler}
                  onBlur={nameBlurHandler}
                  error={nameHasError}
                  helperText={nameHasError ? "Nome inválido" : ""}
                ></NomeInput>
              </InputGroup>
            </FormControl>
            <FormControl isRequired>
              <FormLabel className="letter-spacing-text poppins-text-label text-pattern">
                Email
              </FormLabel>
              <InputGroup className="input-pattern">
                <EmailInput
                  value={email}
                  onChange={emailChangeHandler}
                  onBlur={emailBlurHandler}
                  error={emailHasError}
                  helperText={emailHasError ? "Email inválido" : ""}
                ></EmailInput>
              </InputGroup>
            </FormControl>
            <FormControl isRequired>
              <FormLabel className="letter-spacing-text poppins-text-label text-pattern">
                Senha
              </FormLabel>
              <InputGroup className="input-pattern">
                <PasswordInput
                  value={password}
                  onChange={passwordChangeHandler}
                  onBlur={passwordBlurHandler}
                  error={passwordHasError}
                  helperText={
                    passwordHasError ? "Requer no mínimo 6 caracteres" : ""
                  }
                ></PasswordInput>
              </InputGroup>
            </FormControl>
            <FormControl isRequired>
              <FormLabel className="letter-spacing-text poppins-text-label text-pattern">
                Repetir Senha
              </FormLabel>
              <InputGroup className="input-pattern">
                <ConfirmPasswordInput
                  value={confirmPassword}
                  onChange={confirmPasswordChangeHandler}
                  onBlur={confirmPasswordBlurHandler}
                  error={
                    confirmPassword.length > 0 && password !== confirmPassword
                  }
                  helperText={
                    confirmPassword.length > 0 && password !== confirmPassword
                      ? "Requer mínimo de 6 caracteres"
                      : ""
                  }
                ></ConfirmPasswordInput>
              </InputGroup>
            </FormControl>
            <Button
              className="button-setting button-font"
              type="submit"
              variant="solid"
              style={{
                boxShadow: "0px 2px 2px 0px #00000040",
                marginTop: "4vh",
                marginBottom: "1.5vh",
                backgroundColor: "#0385FD",
              }}
            >
              <Text
                className="letter-spacing-button poppins-text-button"
                fontSize="larger"
              >
                REGISTRAR
              </Text>
            </Button>
            <Link href="/loginhublocal" style={{ textDecoration: "none" }}>
              <Button
                className="button-setting button-font"
                variant="solid"
                style={{
                  backgroundColor: "#00CC99",
                  boxShadow: "0px 2px 2px 0px #00000040",
                }}
              >
                <Text
                  className="letter-spacing-button poppins-text-button"
                  fontSize="larger"
                >
                  LOGAR
                </Text>
              </Button>
            </Link>
          </Stack>
        </form>
      </Box>
    </>
  );

  return ModeloLadoEsquerdoPage({
    realHeight,
    isAnimationSet,
    Login_Image,
    Login_Logo,
    JSX: content,
  });
}

export default Register;