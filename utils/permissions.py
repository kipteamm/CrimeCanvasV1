from enum import Enum
from typing import (
    Any,
    Callable,
    Dict,
    Generator,
    Optional,
    Type,
    TypeVar,
    Union,
)


T = TypeVar("T", bound=Any)

class flag:
    def __init__(self, func: Callable[..., int]) -> None:
        self.func = func

    def __get__(self, instance: T, owner: Type[T]) -> Union[bool, int]:
        flag_value = self.func()

        if instance is None:
            return flag_value

        return flag_value in instance
    

class Flags:
    @flag
    def user_account():
        return 1 << 0

    @flag
    def admin_account():
        return 1 << 1
    
    @classmethod
    def get_flag_by_value(cls, value):
        for name, flag_value in cls.__dict__.items():
            if isinstance(flag_value, flag) and flag_value.func() == value:
                return name
        return None


class Permissions(Flags):
    def __init__(
        self,
        *,
        permissions: Optional[int] = None,
        **permission_mapping: bool,
    ) -> None:
        self.value = permissions or self._get_enabled_perms_value(permission_mapping)

    def _get_enabled_perms_value(self, permission_mapping: Dict[str, bool]) -> int:
        permissions = 0
        for name, enabled in permission_mapping.items():
            if enabled:
                permissions |= getattr(Flags, name, 0)

        return permissions
    
    def _contains(self, permission: int) -> bool:
        return (self.value & permission) == permission

    def __contains__(self, item: Any) -> bool:
        if isinstance(item, Permissions):
            return self._contains(item.value)

        elif isinstance(item, int):
            return self._contains(item)

        elif isinstance(item, list):
            return any(self._contains(value) for value in item)

        elif isinstance(item, flag):  # Compare with flag instance
            return item.func() in self

        else:
            raise TypeError(
                f"Can't compare {self.__class__.__name__} with {item.__class__.__name__}"
            )

    def _list_enabled_perms(self) -> Generator[str, None, None]:
        for cls in type(self).mro():
            for flag_name, value in cls.__dict__.items():
                if (isinstance(value, flag)) and (getattr(cls, flag_name) in self):
                    yield f"{flag_name}=True"

    def __str__(self) -> str:
        return f"{self.__class__.__name__}({', '.join(self._list_enabled_perms())})"