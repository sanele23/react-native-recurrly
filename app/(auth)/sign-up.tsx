import { Link } from "expo-router";
import { Text, View } from "react-native";

const SignUp = () => {
  return (
    <View>
      <Text>Sign Up Screen</Text>
      <Link href="/(auth)/sign-in">Sign In</Link>
    </View>
  );
};

export default SignUp;
