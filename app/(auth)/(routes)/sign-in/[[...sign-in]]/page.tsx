import { SignIn } from "@clerk/nextjs";

const SignInPage = () => {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SignIn appearance={{
          elements: {
            footer: {
              display: 'none',
            },
          },
        }} />
      </div>
    );
  };
  
  export default SignInPage;

  // const SignInPage = () => {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <SignIn />
  //     </div>
  //   );
  // };
  
  // export default SignInPage;