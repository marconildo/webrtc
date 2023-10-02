import { useState } from "react";
import { 
  TextInput,
  Stack,
  Modal,
  Button
} from '@mantine/core';
import { useForm, yupResolver } from '@mantine/form';
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";

const schema = Yup.object().shape({
  roomName: Yup.string().required("This field is required."),
  userName: Yup.string().required("This field is required.")
}); 

function MainPage() {
  const navigate = useNavigate();
  const [ opened ] = useState(true);

  const form = useForm({
    initialValues: {
      roomName: '',
      userName: '',
    },
    validate: yupResolver(schema)
  });

  const generateRandomString = (length = 5) => {
    const characters =
      'abcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let result = '';
  
    // Create an array of 32-bit unsigned integers
    const randomValues = new Uint32Array(length);
    
    // Generate random values
    window.crypto.getRandomValues(randomValues);
    randomValues.forEach((value) => {
      result += characters.charAt(value % charactersLength);
    });
    return result;
  }

  const generatRoomId = () => {
    const room = `${generateRandomString(5)}-${generateRandomString(7)}`;
    form.setValues({
      roomName: room
    });
  }

  const goToRoom = (data) => {
    if (!form.isValid()) return;

    window.sessionStorage.setItem("name", data.userName)
    navigate(`/${data.roomName}`);
  }

  return (
    <Modal
      className="login"
      opened={opened}
      onClose={() => {}}
      closeOnClickOutside={false}
      centered
      title="Join or create a room">
      <form onSubmit={form.onSubmit((data) => goToRoom(data))}>
        <Stack>
          <TextInput
            label="User Name"
            placeholder='User Name'
            radius="md"
            {...form.getInputProps('userName')} />
          <TextInput
            label="Room Name"
            placeholder='Room Name'
            radius="md"
            {...form.getInputProps('roomName')} />
          <Button 
            onClick={() => generatRoomId()}
            variant="outline">
            Generate a random room
          </Button>
          <Button type="submit">Start</Button>
        </Stack>
      </form>
    </Modal>
  )
}

export default MainPage
