import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt } from 'azle';
import { v4 as uuidv4 } from 'uuid';

type Livestock = Record<{
    id: string;
    name: string;
    breed: string;
    species: string;
    birthplace_name: string;
    birthplace_address: string;
    birthdate: nat64;
    gender: string;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
}>

type LivestockPayload = Record<{
    name: string;
    breed: string;
    species: string;
    birthplace_name: string;
    birthplace_address: string;
    birthdate: nat64;
    gender: string;
}>

const livestockStorage = new StableBTreeMap<string, Livestock>(0, 44, 1024);

$query;
export function getLivestocks(): Result<Vec<Livestock>, string> {
    return Result.Ok(livestockStorage.values());
}

$query;
export function getLivestock(id: string): Result<Livestock, string> {
    return match(livestockStorage.get(id), {
        Some: (livestock) => Result.Ok<Livestock, string>(livestock),
        None: () => Result.Err<Livestock, string>(`a livestock with id=${id} not found`)
    });
}

$update;
export function addLivestock(payload: LivestockPayload): Result<Livestock, string> {
    const livestock: Livestock = { id: uuidv4(), createdAt: ic.time(), updatedAt: Opt.None, ...payload };
    livestockStorage.insert(livestock.id, livestock);
    return Result.Ok(livestock);
}

$update;
export function updateLivestock(id: string, payload: LivestockPayload): Result<Livestock, string> {
    return match(livestockStorage.get(id), {
        Some: (livestock) => {
            const updatedLivestock: Livestock = { ...livestock, ...payload, updatedAt: Opt.Some(ic.time()) };
            livestockStorage.insert(livestock.id, updatedLivestock);
            return Result.Ok<Livestock, string>(updatedLivestock);
        },
        None: () => Result.Err<Livestock, string>(`couldn't update a livestock with id=${id}. livestock not found`)
    });
}

$update;
export function deleteLivestock(id: string): Result<Livestock, string> {
    return match(livestockStorage.remove(id), {
        Some: (deletedLivestock) => Result.Ok<Livestock, string>(deletedLivestock),
        None: () => Result.Err<Livestock, string>(`couldn't delete a livestock with id=${id}. livestock not found.`)
    });
}

// a workaround to make uuid package work with Azle
globalThis.crypto = {
    // @ts-ignore
    getRandomValues: () => {
        let array = new Uint8Array(32);

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }

        return array;
    }
};