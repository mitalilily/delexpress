import { Stack } from "@mui/material";
import UserConnectedChannels from "../../components/channels/UserConnectedChannels";

const Channels = () => {
  return (
    <Stack spacing={4}>
      <UserConnectedChannels />
    </Stack>
  );
};

export default Channels;
