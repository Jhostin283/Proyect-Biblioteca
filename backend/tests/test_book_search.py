from fastapi.testclient import TestClient

from app.models.user import Role


def create_sample_books(client: TestClient, count: int = 25) -> list[dict]:
    books = []
    for i in range(1, count + 1):
        isbn = f"978000000{i:04d}"
        payload = {
            "isbn": isbn,
            "title": f"Libro {i:02d}",
            "author": "Autor General",
            "genre": "Novela" if i % 2 == 0 else "Ensayo",
            "publication_year": 2000 + (i % 20),
            "description": f"Descripción del libro {i}",
        }
        res = client.post("/api/books", json=payload)
        assert res.status_code == 201
        books.append(res.json())
    return books


def test_list_books_default_pagination(client: TestClient, auth_as) -> None:
    auth_as(Role.librarian)
    create_sample_books(client, 25)

    # Autenticado como reader para consultar
    auth_as(Role.reader)
    response = client.get("/api/books")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 25
    assert data["page"] == 1
    assert data["size"] == 10
    assert len(data["items"]) == 10
    # Verificamos orden alfabético por título
    titles = [item["title"] for item in data["items"]]
    assert titles == sorted(titles)


def test_list_books_last_page(client: TestClient, auth_as) -> None:
    auth_as(Role.librarian)
    create_sample_books(client, 25)

    auth_as(Role.reader)
    response = client.get("/api/books?page=3&size=10")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 25
    assert data["page"] == 3
    assert data["size"] == 10
    assert len(data["items"]) == 5


def test_list_books_invalid_size(client: TestClient, auth_as) -> None:
    auth_as(Role.reader)
    response = client.get("/api/books?size=100")
    assert response.status_code == 422


def test_list_books_invalid_page(client: TestClient, auth_as) -> None:
    auth_as(Role.reader)
    response = client.get("/api/books?page=0")
    assert response.status_code == 422


def test_list_books_unauthorized(client: TestClient) -> None:
    response = client.get("/api/books")
    assert response.status_code == 401


def test_search_books_by_author(client: TestClient, auth_as) -> None:
    auth_as(Role.librarian)
    client.post(
        "/api/books",
        json={
            "isbn": "9786073112871",
            "title": "Cien años de soledad",
            "author": "Gabriel García Márquez",
            "genre": "Novela",
            "publication_year": 1967,
        },
    )
    client.post(
        "/api/books",
        json={
            "isbn": "9786073112872",
            "title": "La casa de los espíritus",
            "author": "Isabel Allende",
            "genre": "Novela",
            "publication_year": 1982,
        },
    )

    auth_as(Role.reader)
    response = client.get("/api/books?q=garcía")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["author"] == "Gabriel García Márquez"


def test_search_books_no_results(client: TestClient, auth_as) -> None:
    auth_as(Role.librarian)
    client.post(
        "/api/books",
        json={
            "isbn": "9786073112873",
            "title": "Don Quijote",
            "author": "Miguel de Cervantes",
            "genre": "Novela",
            "publication_year": 1605,
        },
    )

    auth_as(Role.reader)
    response = client.get("/api/books?q=inexistente_xyz_123")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["items"] == []


def test_filter_by_genre_and_search_q(client: TestClient, auth_as) -> None:
    auth_as(Role.librarian)
    client.post(
        "/api/books",
        json={
            "isbn": "9786073112874",
            "title": "Veinte poemas de amor",
            "author": "Pablo Neruda",
            "genre": "Poesía",
            "publication_year": 1924,
        },
    )
    client.post(
        "/api/books",
        json={
            "isbn": "9786073112875",
            "title": "Canto General",
            "author": "Pablo Neruda",
            "genre": "Ensayo",
            "publication_year": 1950,
        },
    )
    client.post(
        "/api/books",
        json={
            "isbn": "9786073112876",
            "title": "Rimas y Leyendas",
            "author": "Gustavo Adolfo Bécquer",
            "genre": "Poesía",
            "publication_year": 1871,
        },
    )

    auth_as(Role.reader)
    response = client.get("/api/books?genre=Poesía&q=neruda")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["title"] == "Veinte poemas de amor"
    assert data["items"][0]["genre"] == "Poesía"


def test_get_genres_unique_and_sorted(client: TestClient, auth_as) -> None:
    auth_as(Role.librarian)
    client.post(
        "/api/books",
        json={
            "isbn": "9786073112881",
            "title": "Libro Poesía",
            "author": "Autor A",
            "genre": "Poesía",
            "publication_year": 2000,
        },
    )
    client.post(
        "/api/books",
        json={
            "isbn": "9786073112882",
            "title": "Libro Ciencia Ficción",
            "author": "Autor B",
            "genre": "Ciencia Ficción",
            "publication_year": 2005,
        },
    )
    client.post(
        "/api/books",
        json={
            "isbn": "9786073112883",
            "title": "Otro Libro Poesía",
            "author": "Autor C",
            "genre": "Poesía",
            "publication_year": 2010,
        },
    )

    auth_as(Role.reader)
    response = client.get("/api/books/genres")
    assert response.status_code == 200
    genres = response.json()
    assert "Ciencia Ficción" in genres
    assert "Poesía" in genres
    # Comprobar que no hay duplicados y que están ordenados
    assert len(genres) == len(set(genres))
    assert genres == sorted(genres)


def test_get_genres_unauthorized(client: TestClient) -> None:
    response = client.get("/api/books/genres")
    assert response.status_code == 401
