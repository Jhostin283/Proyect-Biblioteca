from fastapi.testclient import TestClient

from app.models.user import Role


def test_create_book_success_librarian(client: TestClient, auth_as) -> None:
    auth_as(Role.librarian)
    payload = {
        "isbn": "9786073112878",
        "title": "Cien años de soledad",
        "author": "Gabriel García Márquez",
        "genre": "Novela",
        "publication_year": 1967,
        "description": "Una obra cumbre",
    }
    response = client.post("/api/books", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["isbn"] == "9786073112878"
    assert data["title"] == "Cien años de soledad"
    assert data["created_by"] == 1


def test_create_book_forbidden_for_reader(client: TestClient, auth_as) -> None:
    auth_as(Role.reader)
    payload = {
        "isbn": "9786073112879",
        "title": "Libro de prueba",
        "author": "Autor",
        "genre": "Ficción",
        "publication_year": 2020,
    }
    response = client.post("/api/books", json=payload)
    assert response.status_code == 403
    assert response.json()["detail"] == "No tienes permiso para esta acción"


def test_create_book_unauthorized(client: TestClient) -> None:
    payload = {
        "isbn": "9786073112879",
        "title": "Libro de prueba",
        "author": "Autor",
        "genre": "Ficción",
        "publication_year": 2020,
    }
    response = client.post("/api/books", json=payload)
    assert response.status_code == 401


def test_create_book_missing_fields(client: TestClient, auth_as) -> None:
    auth_as(Role.librarian)
    payload = {
        "isbn": "9786073112878",
        # Falta title y author
        "genre": "Novela",
        "publication_year": 1967,
    }
    response = client.post("/api/books", json=payload)
    assert response.status_code == 422


def test_create_book_duplicate_isbn(client: TestClient, auth_as) -> None:
    auth_as(Role.librarian)
    payload = {
        "isbn": "9786073112878",
        "title": "Cien años de soledad",
        "author": "Gabriel García Márquez",
        "genre": "Novela",
        "publication_year": 1967,
    }
    client.post("/api/books", json=payload)

    # Intento duplicado
    dup_payload = {
        "isbn": "9786073112878",
        "title": "Otro título",
        "author": "Otro autor",
        "genre": "Cuento",
        "publication_year": 2000,
    }
    response = client.post("/api/books", json=dup_payload)
    assert response.status_code == 409
    assert response.json()["detail"] == "El ISBN ya está registrado"


def test_create_book_invalid_isbn_format(client: TestClient, auth_as) -> None:
    auth_as(Role.librarian)
    payload = {
        "isbn": "12345",
        "title": "Título",
        "author": "Autor",
        "genre": "Género",
        "publication_year": 2000,
    }
    response = client.post("/api/books", json=payload)
    assert response.status_code == 422


def test_create_book_future_year(client: TestClient, auth_as) -> None:
    auth_as(Role.librarian)
    payload = {
        "isbn": "9786073112871",
        "title": "Futuro",
        "author": "Autor",
        "genre": "Ciencia Ficción",
        "publication_year": 2999,
    }
    response = client.post("/api/books", json=payload)
    assert response.status_code == 422


def test_create_book_limit_valid_year(client: TestClient, auth_as) -> None:
    auth_as(Role.librarian)
    payload = {
        "isbn": "9786073112872",
        "title": "Antiguo",
        "author": "Autor Antiguo",
        "genre": "Historia",
        "publication_year": 1450,
    }
    response = client.post("/api/books", json=payload)
    assert response.status_code == 201


def test_create_book_created_by_taken_from_token(client: TestClient, auth_as) -> None:
    user = auth_as(Role.librarian)
    user.id = 5

    payload = {
        "isbn": "9786073112873",
        "title": "Libro de creador",
        "author": "Autor",
        "genre": "Ficción",
        "publication_year": 2010,
        "created_by": 1,  # Intento de suplantar
    }
    response = client.post("/api/books", json=payload)
    assert response.status_code == 201
    assert response.json()["created_by"] == 5


def test_get_book_success_reader(client: TestClient, auth_as) -> None:
    auth_as(Role.librarian)
    created = client.post(
        "/api/books",
        json={
            "isbn": "9786073112874",
            "title": "Rayuela",
            "author": "Julio Cortázar",
            "genre": "Novela",
            "publication_year": 1963,
        },
    ).json()

    # Reader puede consultar
    auth_as(Role.reader)
    response = client.get(f"/api/books/{created['id']}")
    assert response.status_code == 200
    assert response.json()["title"] == "Rayuela"


def test_get_book_not_found(client: TestClient, auth_as) -> None:
    auth_as(Role.reader)
    response = client.get("/api/books/9999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Libro no encontrado"


def test_update_book_success_admin(client: TestClient, auth_as) -> None:
    auth_as(Role.librarian)
    created = client.post(
        "/api/books",
        json={
            "isbn": "9786073112875",
            "title": "Pedro Páramo",
            "author": "Juan Rulfo",
            "genre": "Ficción",
            "publication_year": 1955,
        },
    ).json()

    auth_as(Role.admin)
    response = client.put(
        f"/api/books/{created['id']}",
        json={"genre": "Realismo mágico"},
    )
    assert response.status_code == 200
    assert response.json()["genre"] == "Realismo mágico"


def test_update_book_duplicate_isbn(client: TestClient, auth_as) -> None:
    auth_as(Role.librarian)
    client.post(
        "/api/books",
        json={
            "isbn": "9786073112880",
            "title": "Libro 1",
            "author": "Autor 1",
            "genre": "Ficción",
            "publication_year": 2001,
        },
    )
    b2 = client.post(
        "/api/books",
        json={
            "isbn": "9786073112881",
            "title": "Libro 2",
            "author": "Autor 2",
            "genre": "Ficción",
            "publication_year": 2002,
        },
    ).json()

    # Intentar cambiar el ISBN de b2 por el de b1
    response = client.put(f"/api/books/{b2['id']}", json={"isbn": "9786073112880"})
    assert response.status_code == 409
    assert response.json()["detail"] == "El ISBN ya está registrado"


def test_update_book_not_found(client: TestClient, auth_as) -> None:
    auth_as(Role.admin)
    response = client.put("/api/books/9999", json={"title": "Nuevo"})
    assert response.status_code == 404


def test_delete_book_success_librarian(client: TestClient, auth_as) -> None:
    auth_as(Role.librarian)
    created = client.post(
        "/api/books",
        json={
            "isbn": "9786073112899",
            "title": "Para borrar",
            "author": "Autor",
            "genre": "Ficción",
            "publication_year": 2021,
        },
    ).json()

    del_resp = client.delete(f"/api/books/{created['id']}")
    assert del_resp.status_code == 204

    # Verificar que ya no existe
    get_resp = client.get(f"/api/books/{created['id']}")
    assert get_resp.status_code == 404


def test_delete_book_forbidden_for_reader(client: TestClient, auth_as) -> None:
    auth_as(Role.librarian)
    created = client.post(
        "/api/books",
        json={
            "isbn": "9786073112890",
            "title": "No borrar",
            "author": "Autor",
            "genre": "Ficción",
            "publication_year": 2021,
        },
    ).json()

    auth_as(Role.reader)
    del_resp = client.delete(f"/api/books/{created['id']}")
    assert del_resp.status_code == 403
