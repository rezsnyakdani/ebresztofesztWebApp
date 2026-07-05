using Logic.Helpers;
using System;

namespace Logic.Logics
{
    public class WorkshopSessionLogic
    {
        public void ValidateSessionData(DateTime startTime, DateTime endTime, string place, int capacity, int? minAge, int? maxAge, string? targetGender, DateTime? startRegistration = null, DateTime? endRegistration = null)
        {
            if (string.IsNullOrWhiteSpace(place)) throw new BadRequestException("A helyszín megadása kötelező!");
            if (startTime == default || endTime == default) throw new BadRequestException("A kezdési és befejezési időpontok megadása kötelező!");
            if (startTime >= endTime) throw new BadRequestException("A kezdésnek a befejezés előtt kell lennie!");
            if (startTime.Date != endTime.Date) throw new BadRequestException("A foglalkozásnak ugyanazon a napon kell kezdődnie és végződnie!");

            if (capacity <= 0) throw new BadRequestException("A kapacitásnak 0-nál nagyobb pozitív egész számnak kell lennie!");

            if (targetGender != null && targetGender != "Férfi" && targetGender != "Nő")
                throw new BadRequestException("A célcsoport neme csak 'Férfi' vagy 'Nő' lehet!");

            if (minAge.HasValue && minAge <= 0) throw new BadRequestException("Az alsó korhatár csak pozitív szám lehet!");
            if (maxAge.HasValue && maxAge <= 0) throw new BadRequestException("A felső korhatár csak pozitív szám lehet!");

            if (minAge.HasValue && maxAge.HasValue && minAge >= maxAge)
                throw new BadRequestException("Az alsó korhatárnak kisebbnek kell lennie a felső korhatárnál!");

            if (startRegistration.HasValue && !endRegistration.HasValue)
                throw new BadRequestException("A jelentkezési időszak végét is meg kell adni, ha a kezdete meg van adva!");
            if (!startRegistration.HasValue && endRegistration.HasValue)
                throw new BadRequestException("A jelentkezési időszak kezdetét is meg kell adni, ha a vége meg van adva!");
            if (startRegistration.HasValue && endRegistration.HasValue && startRegistration >= endRegistration)
                throw new BadRequestException("A jelentkezési időszak kezdetének korábbinak kell lennie a végénél!");
        }
    }
}