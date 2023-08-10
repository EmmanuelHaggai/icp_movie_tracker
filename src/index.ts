import {
    $query,
    $update,
    Record,
    StableBTreeMap,
    Vec,
    match,
    Result,
    nat64,
    ic,
    Principal,
    Opt
} from "azle";
import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";

type Movie = Record<{
    id: string;
    user_id: string;
    ic_caller_id: string;
    title: string;
    synopsis: string;
    myRatingOutOfTen: string;
    posterURL: string;
    status: "completed" | "still_watching";
    resume: string;
    notes: string;
    created_at: nat64;
    updated_at: Opt<nat64>;
}>;

type MoviePayload = Record<{
    title: string;
    synopsis: string;
    myRatingOutOfTen: string;
    posterURL: string;
    status: "completed" | "still_watching";
    resume: string;
    notes: string;
}>;

type User = Record<{
    id: string;
    ic_caller_id: string;
    username: string;
    user_password: string;
    created_at: nat64;
    updated_at: Opt<nat64>;
}>;

type UserPayload = Record<{
    id: string;
    username: string;
    user_password: string;
}>;

const movieStorage = new StableBTreeMap<string, Movie>(0, 44, 10_000);
const userStorage = new StableBTreeMap<string, User>(0, 44, 1024);

$query;
export function getCallerID(): string {
    return ic.caller().toString();
}

function generateUUID(): string {
    return uuidv4();
}

function hashPassword(password: string): string {
    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");
    return hashedPassword;
}

$update;
export function createMovieUser(username: string, user_password: string): Result<User, string> {
    const id = generateUUID();
    const ic_caller_id = getCallerID();
    const hashedPassword = hashPassword(user_password);
    const user: User = {
        id,
        ic_caller_id,
        username,
        user_password: hashedPassword,
        created_at: ic.time(),
        updated_at: Opt.None
    };

    userStorage.insert(user.id, user);

    return Result.Ok(user);
}

$query;
export function getAllUsers(): Result<Vec<User>, string> {
    return Result.Ok(userStorage.values());
}

$query;
export function getSpecificUser(id: string): Result<User, string> {
    return match(userStorage.get(id), {
        Some: (user) => Result.Ok<User, string>(user),
        None: () => Result.Err<User, string>(`A user with the ID: ${id} was not found. Please check the ID and try again.`)
    });
}

$update;
export function deleteUser(id: string): Result<User, string> {
    return match(userStorage.remove(id), {
        Some: (removedUser) => Result.Ok<User, string>(removedUser),
        None: () => Result.Err<User, string>(`Couldn't delete a user with the ID: ${id} because the user was not found. Please check the ID and then try again.`)
    });
}

$update;
export function LogMovie(payload: MoviePayload, user_id: string): Result<Movie, string> {
    const ic_caller_id = getCallerID();
    const movie: Movie = {
        id: generateUUID(),
        user_id: user_id,
        ic_caller_id: ic_caller_id,
        created_at: ic.time(),
        updated_at: Opt.None,
        ...payload
    };
    movieStorage.insert(movie.id, movie);
    return Result.Ok(movie);
}

$query;
export function getAllMovies(): Result<Vec<Movie>, string> {
    return Result.Ok(movieStorage.values());
}

$query;
export function getOneMovie(id: string): Result<Movie, string> {
    return match(movieStorage.get(id), {
        Some: (movie) => Result.Ok<Movie, string>(movie),
        None: () => Result.Err<Movie, string>(`A movie with the ID: ${id} was not found. Please check the ID and try again.`)
    });
}

$update;
export function updateMovie(id: string, payload: MoviePayload): Result<Movie, string> {
    return match(movieStorage.get(id), {
        Some: (movie) => {
            const updatedMessage: Movie = { ...movie, ...payload, updated_at: Opt.Some(ic.time()) };
            movieStorage.insert(movie.id, updatedMessage);
            return Result.Ok<Movie, string>(updatedMessage);
        },
        None: () => Result.Err<Movie, string>(`Couldn't update a movie with the ID: ${id} because the movie was not found. Please check the ID and then try again.`)
    });
}

$update;
export function removeLoggedMovie(id: string): Result<Movie, string> {
    return match(movieStorage.remove(id), {
        Some: (removedMovie) => Result.Ok<Movie, string>(removedMovie),
        None: () => Result.Err<Movie, string>(`Couldn't delete a movie with the ID: ${id} because the movie was not found. Please check the ID and then try again.`)
    });
}


// a workaround to make uuid package work with Azle
globalThis.crypto = {
    getRandomValues: () => {
        let array = new Uint8Array(32)

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256)
        }

        return array
    }
}
