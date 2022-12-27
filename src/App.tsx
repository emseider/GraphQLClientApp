import { gql, useMutation, useQuery } from "@apollo/client";
import "./App.css";
import {
  Button,
  ChakraProvider,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  List,
  ListIcon,
  ListItem,
  ListProps,
  StackProps,
} from "@chakra-ui/react";
import { CheckCircleIcon, DeleteIcon } from "@chakra-ui/icons";
import { useState } from "react";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

const TODOS_QUERY = gql`
  query Todos {
    todos {
      id
      text
      completed
    }
  }
`;

const ADD_TODO_MUTATION = gql`
  mutation AddTodo($text: String!) {
    addTodo(text: $text) {
      id
      text
      completed
    }
  }
`;

const EDIT_TODO_MUTATION = gql`
  mutation EditTodo($id: ID!, $completed: Boolean) {
    editTodo(id: $id, completed: $completed) {
      id
      completed
    }
  }
`;

const DELETE_TODO_MUTATION = gql`
  mutation DeleteTodo($id: ID!) {
    deleteTodo(id: $id) {
      id
    }
  }
`;

interface TodoListProps extends ListProps {
  todos: Todo[];
  onToggle: (id: string, completed: boolean) => void;
  onRemove: (id: string) => void;
}
function TodoList({ todos = [], onToggle, onRemove, ...props }: TodoListProps) {
  const sorted = todos.sort((a, b) => {
    if (a.completed && !b.completed) return -1;
    if (!a.completed && b.completed) return 1;
    return 0;
  });
  return (
    <List spacing={3} {...props}>
      {sorted.map((todo: Todo) => (
        <ListItem key={`${todo.id}-${todo.text.trim()}`}>
          <Button
            bg="gray.100"
            color="gray.800"
            onClick={() => onToggle(todo.id, todo.completed)}
          >
            {todo.completed && (
              <ListIcon as={CheckCircleIcon} color="green.500" />
            )}
            {todo.text}
          </Button>
          <IconButton aria-label='Search database' icon={<DeleteIcon />} bgColor="red.500" onClick={() => onRemove(todo.id)} />
        </ListItem>
      ))}
    </List>
  );
}

interface TodoActionsProps extends StackProps {
  onAdd: (args: string) => void;
}
function TodoActions({ onAdd, ...props }: TodoActionsProps) {
  const [text, setText] = useState("");

  const onAddItem = () => {
    onAdd(text);
    setText('');
  }

  return (
    <HStack {...props}>
      <Input
        value={text}
        placeholder="Write a task"
        onChange={(e) => setText(e.target.value)}
      />
      <Button color="white" bg="blue.600" onClick={onAddItem}>
        Add
      </Button>
    </HStack>
  );
}

function App() {
  const { loading, error, data } = useQuery(TODOS_QUERY);
  const [addTodo] = useMutation(ADD_TODO_MUTATION, {
    update(cache, { data: { addTodo } }) {
      const query = cache.readQuery<{ todos: Todo[] }>({ query: TODOS_QUERY });
      cache.writeQuery({
        query: TODOS_QUERY,
        data: { todos: query?.todos.concat([addTodo]) },
      });
    },
  });

  const [editTodo] = useMutation(EDIT_TODO_MUTATION, {
    update(cache) {
      const query = cache.readQuery<{ todos: Todo[] }>({ query: TODOS_QUERY });
      const todos = query?.todos || [];
      cache.writeQuery({
        query: TODOS_QUERY,
        data: { todos },
      });
    },
  });

  const [deleteTodo] = useMutation(DELETE_TODO_MUTATION, {
    update(cache, { data: { deleteTodo } }) {
      const query = cache.readQuery<{ todos: Todo[] }>({ query: TODOS_QUERY });
      cache.writeQuery({
        query: TODOS_QUERY,
        data: { todos: query?.todos.filter((t) => t.id !== deleteTodo.id) },
      });
    },
  });

  if (loading) return <span>Loading...</span>;
  if (error) return <span>Error! {error && error.message}</span>;

  const todoList: Todo[] = [...data.todos];

  const onToggle = (id: string, completed: boolean) => {
    editTodo({
      variables: {
        id,
        completed: !completed,
      },
    });
  };

  const onAdd = (text: string) => {
    addTodo({
      variables: {
        text,
      },
    });
  };

  const onRemove = (id: string) => {
    deleteTodo({
      variables: {
        id,
      },
    });
  };

  return (
    <ChakraProvider>
      <Flex
        minH="100vh"
        bg="gray.600"
        color="white"
        justifyContent="center"
        alignItems="center"
        flexDir="column"
      >
        <Heading>APOLLO GRAPHQL EXAMPLE</Heading>
        <TodoActions onAdd={onAdd} mt={10} />
        <TodoList todos={todoList} onToggle={onToggle} onRemove={onRemove} mt={10} />
      </Flex>
    </ChakraProvider>
  );
}

export default App;
